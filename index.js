'use strict';

import React, { Component } from 'react';
import PropTypes from 'prop-types';


import {
  StyleSheet,
  Dimensions,
  Vibration,
  Animated,
  Easing,
  View,
  Text,
  Platform,
  PermissionsAndroid,
  Image, AlertIOS,TouchableOpacity,
  ImageBackground,
} from 'react-native';

import Permissions from 'react-native-permissions'
import { RNCamera as Camera } from 'react-native-camera'
import {trans2xPt2Dp} from "../../app/common/ScreenUtils";

const PERMISSION_AUTHORIZED = 'authorized';
const CAMERA_PERMISSION = 'camera';

export default class QRCodeScanner extends Component {
  static propTypes = {
    onRead: PropTypes.func.isRequired,
    myProps:  PropTypes.any.isRequired,
    reactivate: PropTypes.bool,
    reactivateTimeout: PropTypes.number,
    fadeIn: PropTypes.bool,
    showMarker: PropTypes.bool,
    cameraType: PropTypes.oneOf(['front','back']),
    customMarker: PropTypes.element,
    containerStyle: PropTypes.any,
    cameraStyle: PropTypes.any,
    topViewStyle: PropTypes.any,
    bottomViewStyle: PropTypes.any,
    topContent: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.string,
    ]),
    bottomContent: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.string,
    ]),
    notAuthorizedView: PropTypes.element,
    permissionDialogTitle: PropTypes.string,
    permissionDialogMessage: PropTypes.string,
    checkAndroid6Permissions: PropTypes.bool,
    onBackPre: PropTypes.func.isRequired,
    toggleFlashSwitch: PropTypes.func.isRequired,
  }

  static defaultProps = {
    onRead: () => (console.log('QR code scanned!')),
    onBackPre: () => (console.log('GO BACK!')),
    reactivate: false,
    reactivateTimeout: 0,
    fadeIn: true,
    showMarker: false,
    cameraType: 'back',
    notAuthorizedView: (
      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{
          textAlign: 'center',
          fontSize: 16,
        }}>
          Camera not authorized
        </Text>
      </View>
    ),
    pendingAuthorizationView: (
      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{
          textAlign: 'center',
          fontSize: 16,
        }}>
          ...
        </Text>
      </View>
    ),
    permissionDialogTitle: "Info",
    permissionDialogMessage: "Need camera permission",
    checkAndroid6Permissions: false,
  }

  constructor(props) {
    super(props);
    this.state = {
      scanning: false,
      fadeInOpacity: new Animated.Value(40),
      isAuthorized: false,
      isAuthorizationChecked: false,
    }

    this._handleBarCodeRead = this._handleBarCodeRead.bind(this);
  }

  componentWillMount() {
    if (Platform.OS === 'ios') {
      Permissions.request(CAMERA_PERMISSION).then(response => {
        this.setState({
          isAuthorized: response === PERMISSION_AUTHORIZED,
          isAuthorizationChecked: true
        });
      });
    } else if (Platform.OS === 'android' && this.props.checkAndroid6Permissions) {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
        'title': this.props.permissionDialogTitle,
        'message':  this.props.permissionDialogMessage,
      })
        .then((granted) => {
          const isAuthorized = Platform.Version >= 23 ?
            granted === PermissionsAndroid.RESULTS.GRANTED :
            granted === true;

          this.setState({ isAuthorized, isAuthorizationChecked: true })
        })
    } else {
      this.setState({ isAuthorized: true, isAuthorizationChecked: true })
    }
  }


  componentDidMount() {
    console.log('screen:'+Dimensions.get('screen').height+'window:'+Dimensions.get('window').height)

    if (this.props.fadeIn) {
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(
          this.state.fadeInOpacity,
          {
            toValue: 1,
            easing: Easing.inOut(Easing.quad),
          },
        )
      ]).start();
    }
  }

  _setScanning(value) {
    this.setState({ scanning: value });
  }

  _handleBarCodeRead(e) {
    if (!this.state.scanning) {
      Vibration.vibrate();
      this._setScanning(true);
      this.props.onRead(e)
      if (this.props.reactivate) {
        setTimeout(() => (this._setScanning(false)), this.props.reactivateTimeout);
      }
    }
  }

  _renderTopContent() {
    if (this.props.topContent) {
      return this.props.topContent;
    }
    return null;
  }

  _renderBottomContent() {
    if (this.props.bottomContent) {
      return this.props.bottomContent;
    }
    return null;
  }

  _renderCameraMarker() {
    if (this.props.showMarker) {
      if (this.props.customMarker) {
        return this.props.customMarker;
      } else {
        return (
          <View style={styles.rectangleContainer}>
            <View style={styles.topOp}/>
            <View style={styles.midOp}>
              <View style={styles.midLeftOp}/>
              <ImageBackground style={styles.rectangle}
                               source={require('../../app/images/wifi/pic_wifi_scan.png')}
              />
              <View style={styles.midRightOp}/>
            </View>
            <View style={styles.bomOp}>
              <TouchableOpacity onPress={()=>this.flashSwitch()}>
                <Image
                  style={{height: trans2xPt2Dp(42), width: trans2xPt2Dp(42),}}
                  source={require('../../app/images/wifi/flashlight.png')}
                />
              </TouchableOpacity>

              <Text
                style={{fontSize:trans2xPt2Dp(14),marginTop:trans2xPt2Dp(10),color:'white'}}
              >
                打开手电筒
              </Text>

              <TouchableOpacity
                onPress={()=>this.goBackLast()}>
                <Image
                  style={{height: trans2xPt2Dp(20), width: trans2xPt2Dp(20),marginTop:trans2xPt2Dp(44)}}
                  source={require('../../app/images/wifi/iconClose.png')}
                />
              </TouchableOpacity>



            </View>
          </View>
        );
      }
    }
    return null;
  }

  flashSwitch=()=>{
    this.props.toggleFlashSwitch();
  }

  goBackLast=()=>{
    this.props.onBackPre();
  }

  _renderCamera() {
    const { notAuthorizedView, pendingAuthorizationView, cameraType } = this.props
    const { isAuthorized, isAuthorizationChecked } = this.state
    if (isAuthorized) {
      if (this.props.fadeIn) {
        return (
          <Animated.View
            style={{
              opacity: this.state.fadeInOpacity,
              backgroundColor: 'black'
            }}>
            <Camera
              style={[styles.camera, this.props.cameraStyle]}
              onBarCodeRead={this._handleBarCodeRead.bind(this)}
              type={this.props.cameraType}
              flashMode={this.props.flashMode}
            >
              {this._renderCameraMarker()}
            </Camera>
          </Animated.View>
        )
      }
      return (
        <Camera
          type={cameraType}
          style={[styles.camera, this.props.cameraStyle]}
          onBarCodeRead={this._handleBarCodeRead.bind(this)}
        >
          {this._renderCameraMarker()}
        </Camera>
      )
    } else if (!isAuthorizationChecked) {
      return pendingAuthorizationView
    } else {
      return notAuthorizedView
    }
  }

  reactivate() {
    this._setScanning(false);
  }

  render() {
    return (
      <View style={{width:Dimensions.get('window').width,height:1000,backgroundColor:'black'}}>
        <View style={[styles.mainContainer, this.props.containerStyle]}>
          <View style={[styles.infoView, this.props.topViewStyle]}>
            {this._renderTopContent()}
          </View>

          {this._renderCamera()}

          <View style={[styles.infoView, this.props.bottomViewStyle]}>
            {this._renderBottomContent()}
          </View>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,

  },
  infoView: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    width: Dimensions.get('window').width,
  },

  camera: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    height: Dimensions.get('window').width,
    width: Dimensions.get('window').width,
  },

  rectangleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    height: Dimensions.get('window').width,
    width: Dimensions.get('window').width,
  },

  rectangle: {
    height: trans2xPt2Dp(236),
    width: trans2xPt2Dp(236),

  },

  topOp: {
    flex: 0.5,
    width: Dimensions.get('window').width,
    opacity: 0.5,
    backgroundColor:'black',

  },

  midOp: {
    flexDirection:'row',
    width: Dimensions.get('window').width,
    height: trans2xPt2Dp(236),
  },

  midLeftOp: {
    width:((Dimensions.get('window').width)-trans2xPt2Dp(236))/2,
    height: trans2xPt2Dp(236),
    flex: 1,
    opacity: 0.5,
    backgroundColor:'black',

  },

  midRightOp: {
    width:((Dimensions.get('window').width)-trans2xPt2Dp(236))/2,
    flex: 1,
    opacity: 0.5,
    backgroundColor:'black',
    height: trans2xPt2Dp(236),
  },

  bomOp: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 0.5,
    width: Dimensions.get('window').width,
    opacity: 0.5,
    backgroundColor:'black',
  },


})
