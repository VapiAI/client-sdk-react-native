# Vapi React Native SDK

This package lets you start Vapi calls directly in your React Native app.

## 📋 Table of Contents

- [⚠️ Important Notes](#⚠️-important-notes)
- [📋 Prerequisites](#📋-prerequisites)
- [🔧 Installation](#🔧-installation)
- [🚀 Quick Start](#🚀-quick-start)
  - [1. Import and Initialize](#1-import-and-initialize)
  - [2. Set Up Event Listeners](#2-set-up-event-listeners)
  - [3. Start a Call](#3-start-a-call)
  - [4. Control the Call](#4-control-the-call)
- [🔧 Advanced Usage](#🔧-advanced-usage)
- [🐛 Troubleshooting](#🐛-troubleshooting)
- [🔗 Expo Integration](#🔗-expo-integration)
- [📚 API Reference](#📚-api-reference)
- [🤝 Contributing](#🤝-contributing)
- [📄 License](#📄-license)
- [🆘 Support](#🆘-support)

## ⚠️ Important Notes

- **This guide is for bare React Native projects**. If you use **expo build**, skip to the [Expo Integration](#expo-integration)
- **Requires React Native 0.60+** for autolinking support
- **Not compatible with Expo Go** - requires custom native code

## 📋 Prerequisites

- React Native 0.60+
- Node.js 20+
- React Native CLI or @react-native-community/cli
- Xcode 14+ (for iOS development)
- Android Studio (for Android development)
- CocoaPods (for iOS dependencies)

### iOS
- **Minimum iOS version**: 12.0
- **Screen sharing**: Requires iOS 14.0+

### Android
- **Minimum SDK**: 24

## 🔧 Installation

### Step 1: Install Dependencies

Install `@vapi-ai/react-native` along with its peer dependencies:

```bash
# Install main dependencies
npm install @vapi-ai/react-native @daily-co/react-native-daily-js @react-native-async-storage/async-storage react-native-background-timer

# Install exact WebRTC version (important for compatibility)
npm install --save-exact @daily-co/react-native-webrtc@118.0.3-daily.3
```

### Step 2: Platform Setup

#### iOS Setup

1. Update the `platform` in your `Podfile`, since `@daily-co/react-native-webrtc` only works on iOS 12 and above:

```ruby
platform :ios, '12.0'
```

> **Note**: If you wish to **send screen share** from iOS, it only works on **iOS 14** and above. In this case, use iOS 14.0 instead of iOS 12.0.

2. **Install CocoaPods dependencies**:

```bash
npx pod-install
```

3. **Configure Info.plist** (required to prevent crashes):

Add these keys to your `ios/YourApp/Info.plist`:

| Key | Type | Value |
|-----|------|-------|
| `NSCameraUsageDescription` | String | "This app needs camera access for voice calls" |
| `NSMicrophoneUsageDescription` | String | "This app needs microphone access for voice calls" |
| `UIBackgroundModes` | Array | Item 0: `voip` |

`UIBackgroundModes` is handled slightly differently and will resolve to an array. For its first item, specify the value `voip`. This ensures that audio will continue uninterrupted when your app is sent to the background.

To add the new rows through Xcode, open the `Info.plist` and add the following three rows:

| Key                                    | Type   | Value                                             |
| -------------------------------------- | ------ | ------------------------------------------------- |
| Privacy - Camera Usage Description     | String | "Vapi Playground needs camera access to work"     |
| Privacy - Microphone Usage Description | String | "Vapi Playground needs microphone access to work" |
| Required background modes              | Array  | 1 item                                            |
| ---> Item 0                            | String | "App provides Voice over IP services"             |

If you view the raw file contents of `Info.plist`, it should look like this:

```
<dict>
    ...
    <key>NSCameraUsageDescription</key>
    <string>Vapi Playground needs camera access to work</string>
    <key>NSMicrophoneUsageDescription</key>
    <string>Vapi Playground needs microphone access to work</string>
    <key>UIBackgroundModes</key>
    <array>
        <string>voip</string>
    </array>
</dict>
```

#### Android Setup

1. **Update AndroidManifest.xml** - Add permissions:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" />
<uses-feature android:name="android.hardware.camera.autofocus"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

2. **Update build.gradle** - Set minimum SDK in your top-level `build.gradle` file:
```groovy
minSdkVersion = 24
```

If you are running into issues with TurboModules, you might need to disable `newArchEnabled` in your `android/gradle.properties` file.

```properties
newArchEnabled=false
```

(If you run into any issues, refer to [Github issues](https://github.com/react-native-webrtc/react-native-webrtc/issues/720) like [these](https://github.com/jitsi/jitsi-meet/issues/4778), or the `react-native-webrtc` [installation docs](https://github.com/react-native-webrtc/react-native-webrtc/blob/master/Documentation/AndroidInstallation.md), which walk you through a more complicated process. The simpler process laid out above seems to work in a vanilla modern React Native CLI-based setup).

## 🚀 Quick Start

### 1. Import and Initialize

```javascript
import Vapi from '@vapi-ai/react-native';

// Initialize with your API key
const vapi = new Vapi('your-vapi-api-key');
```

### 2. Set Up Event Listeners

```javascript
vapi.on('call-start', () => {
  console.log('Call started');
});

vapi.on('call-end', () => {
  console.log('Call ended');
});

vapi.on('volume-level', (volume) => {
  console.log('Volume level:', volume);
});

vapi.on('error', (error) => {
  console.error('Vapi error:', error);
});
```

### 3. Start a Call

```javascript
try {
  await vapi.start({
    model: {
      provider: 'openai',
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant.',
        },
      ],
    },
    voice: {
      provider: '11labs',
      voiceId: 'pNInz6obpgDQGcFmaJgB',
    },
    firstMessage: 'Hello! How can I help you today?',
  });
} catch (error) {
  console.error('Failed to start call:', error);
}
```

### 4. Control the Call

```javascript
// Mute/unmute
vapi.setMuted(true);

// Send a message
vapi.send({
  type: 'add-message',
  message: {
    role: 'user',
    content: 'Hello from React Native!',
  },
});

// End the call
vapi.stop();
```

## 🔧 Advanced Usage

### Device Management

```javascript
// Get available audio devices
const devices = vapi.getAudioDevices();
console.log('Available devices:', devices);

// Set specific audio device
vapi.setAudioDevice(deviceId);

// Get current device
const currentDevice = vapi.getCurrentAudioDevice();
```

### Error Handling

```javascript
vapi.on('error', (error) => {
  if (error.code === 'PERMISSION_DENIED') {
    // Handle permission errors
    Alert.alert('Permission Required', 'Please grant microphone and camera permissions');
  } else if (error.code === 'NETWORK_ERROR') {
    // Handle network errors
    Alert.alert('Network Error', 'Please check your internet connection');
  }
});
```

## 🐛 Troubleshooting

### Common Issues

#### 1. **Permission Denied**
- Ensure you've added the required permissions to Info.plist/AndroidManifest.xml
- Request permissions at runtime on Android

#### 2. **WebRTC Version Conflicts**
```bash
# If you see version conflicts, use the exact version:
npm install --save-exact @daily-co/react-native-webrtc@118.0.3-daily.3
```

#### 3. **CocoaPods Installation Issues**
```bash
# Clean and reinstall
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

#### 4. **Metro Cache Issues**
```bash
# Reset Metro cache
npx react-native start --reset-cache
```

### Debug Commands

```bash
# Clean iOS build
cd ios && xcodebuild clean && cd ..

# Clean Android build
cd android && ./gradlew clean && cd ..

# Reinstall dependencies
rm -rf node_modules && npm install
```

## 🔗 Expo Integration

> **Warning**: This SDK cannot be used with Expo Go. Use Expo Development Build or EAS Build.

### Expo Setup

1. **Install dependencies**:
```bash
npx expo install @vapi-ai/react-native @daily-co/react-native-daily-js @react-native-async-storage/async-storage react-native-background-timer
npm install --save-exact @daily-co/react-native-webrtc@118.0.3-daily.3
```

2. **Update app.json**:
```json
{
  "expo": {
    "plugins": [
      "@config-plugins/react-native-webrtc",
      "@daily-co/config-plugin-rn-daily-js",
      [
        "expo-build-properties",
        {
          "android": {
            "minSdkVersion": 24
          },
          "ios": {
            "deploymentTarget": "13.4"
          }
        }
      ]
    ]
  }
}
```

3. **Prebuild and run**:
```bash
npx expo prebuild
npx expo run:ios  # or run:android
```



## 📚 API Reference

### Vapi Class

#### Constructor
```javascript
new Vapi(apiKey: string, apiBaseUrl?: string)
```

#### Methods
- `start(assistant, overrides?)` - Start a voice call
- `stop()` - End the current call
- `setMuted(muted: boolean)` - Mute/unmute microphone
- `isMuted()` - Check if currently muted
- `send(message)` - Send a message during call
- `getAudioDevices()` - Get available audio devices
- `setAudioDevice(deviceId)` - Set audio device
- `getCurrentAudioDevice()` - Get current audio device

#### Events
- `call-start` - Call has started
- `call-end` - Call has ended
- `volume-level` - Volume level changed
- `speech-start` - Speech detection started
- `speech-end` - Speech detection ended
- `message` - Received message
- `error` - Error occurred

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

ISC License - see LICENSE file for details.

## 🆘 Support

- **Documentation**: [Vapi Docs](https://docs.vapi.ai)
- **Issues**: [GitHub Issues](https://github.com/VapiAI/react-native-sdk/issues)
- **Discord**: [Vapi Community](https://discord.gg/vapi)
