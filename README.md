# Vapi React Native SDK

This package lets you start Vapi voice and video calls directly in your React Native app.

## 📋 Table of Contents

- [⚠️ Important Notes](#⚠️-important-notes)
- [📋 Prerequisites](#📋-prerequisites)
- [🔧 Installation](#🔧-installation)
  - [🚀 Quick Start](#🚀-quick-start)
    - [1. Import and Initialize](#1-import-and-initialize)
    - [2. Set Up Event Listeners](#2-set-up-event-listeners)
    - [3. Start a Call](#3-start-a-call)
    - [4. Control the Call](#4-control-the-call)
  - [🎥 Video Features](#🎥-video-features)
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
- **Not compatible with TurboModules** - requires `newArchEnabled=false` in `android/gradle.properties`

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

⚠️ If you are running into issues with TurboModules, you might need to disable `newArchEnabled` in your `android/gradle.properties` file.

## 🔧 Installation

### Step 1: Install Dependencies

Install `@vapi-ai/react-native` along with its peer dependencies:

```bash
# Install main dependencies
npm install @vapi-ai/react-native @daily-co/react-native-daily-js @react-native-async-storage/async-storage react-native-background-timer react-native-get-random-values

# Install exact WebRTC version (important for compatibility)
npm install --save-exact @daily-co/react-native-webrtc@118.0.3-daily.4
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
| `NSCameraUsageDescription` | String | "This app needs camera access for video calls" |
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

// Video-specific events
vapi.on('video', (track) => {
  console.log('Video track received:', track);
});

vapi.on('camera-error', (error) => {
  console.error('Camera error:', error);
});
```

### 3. Start a Call

```javascript
try {
  await vapi.start({
     model: {
       provider: 'openai',
       model: 'gpt-4o',
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

## 🎥 Video Features

The SDK now fully supports video calls with the following capabilities:

### Video UI Components

To display video, you'll need to use the `DailyMediaView` component from `@daily-co/react-native-daily-js`:

```javascript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DailyMediaView } from '@daily-co/react-native-daily-js';

const VideoCall = () => {
  const participants = vapi.participants();
  
  return (
    <View style={styles.container}>
      {Object.entries(participants).map(([sessionId, participant]) => (
        <DailyMediaView
          key={sessionId}
          videoTrack={participant.tracks.video.track}
          audioTrack={participant.tracks.audio.track}
          mirror={participant.local}
          zOrder={participant.local ? 1 : 0}
          style={styles.video}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  video: {
    flex: 1,
    margin: 5,
  },
});
```

### Complete Video Example

```javascript
import React, { useState, useEffect } from 'react';
import { View, Button, Text } from 'react-native';
import Vapi from '@vapi-ai/react-native';
import { DailyMediaView } from '@daily-co/react-native-daily-js';

const VideoCallScreen = () => {
  const [vapi] = useState(new Vapi('your-api-key'));
  const [isInCall, setIsInCall] = useState(false);
  const [participants, setParticipants] = useState({});
  const [isVideoOn, setIsVideoOn] = useState(true);

  useEffect(() => {
    // Set up event listeners
    vapi.on('call-start', () => {
      setIsInCall(true);
    });

    vapi.on('call-end', () => {
      setIsInCall(false);
      setParticipants({});
    });

    vapi.on('daily-participant-updated', () => {
      setParticipants(vapi.participants());
    });

    vapi.on('video', (track) => {
      // Video track received, participants will be updated
      setParticipants(vapi.participants());
    });

    return () => {
      vapi.stop();
    };
  }, []);

  const startCall = async () => {
    await vapi.start({
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [{
          role: 'system',
          content: 'You are a helpful video assistant.',
        }],
      },
      voice: {
        provider: 'tavus', // For video avatars
        voiceId: 'your-voice-id',
      },
    });
  };

  const toggleVideo = () => {
    vapi.setLocalVideo(!isVideoOn);
    setIsVideoOn(!isVideoOn);
  };

  return (
    <View style={{ flex: 1 }}>
      {!isInCall ? (
        <Button title="Start Video Call" onPress={startCall} />
      ) : (
        <>
          <View style={{ flex: 1 }}>
            {Object.entries(participants).map(([id, participant]) => (
              <DailyMediaView
                key={id}
                videoTrack={participant.tracks?.video?.track}
                audioTrack={participant.tracks?.audio?.track}
                mirror={participant.local}
                style={{ flex: 1 }}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', padding: 20 }}>
            <Button 
              title={isVideoOn ? "Turn Off Video" : "Turn On Video"} 
              onPress={toggleVideo} 
            />
            <Button title="Switch Camera" onPress={() => vapi.cycleCamera()} />
            <Button title="End Call" onPress={() => vapi.stop()} />
          </View>
        </>
      )}
    </View>
  );
};
```

## 🔧 Advanced Usage

### Video Call Features

```javascript
// Enable/disable video
vapi.setLocalVideo(true);  // Turn on camera
vapi.setLocalVideo(false); // Turn off camera

// Check if video is enabled
const isVideoOn = vapi.isVideoEnabled();

// Switch between front/back camera
vapi.cycleCamera();

// Start camera before call
await vapi.startCamera();

// Display video tracks using DailyMediaView
import { DailyMediaView } from '@daily-co/react-native-daily-js';

// In your component
<DailyMediaView
  videoTrack={participant.videoTrack}
  audioTrack={participant.audioTrack}
  mirror={participant.local}
  zOrder={participant.local ? 1 : 0}
  style={styles.video}
/>
```

### Say Feature

```javascript
// Have the assistant say something
vapi.say('Hello, how can I help you today?');

// With options
vapi.say(
  'Goodbye!', 
  true,  // endCallAfterSpoken
  false, // interruptionsEnabled
  false  // interruptAssistantEnabled
);
```

### Device Management

```javascript
// Audio devices
const audioDevices = vapi.getAudioDevices();
vapi.setAudioDevice(deviceId);
const currentAudioDevice = vapi.getCurrentAudioDevice();

// Camera devices
const cameraDevices = vapi.getCameraDevices();
vapi.setCamera(deviceId);
const currentCamera = vapi.getCurrentCameraDevice();
```

### Screen Sharing

```javascript
// Start screen sharing
vapi.startScreenShare();

// Stop screen sharing
vapi.stopScreenShare();
```

### Participant Management

```javascript
// Get all participants
const participants = vapi.participants();

// Update participant settings
vapi.updateParticipant(sessionId, {
  setSubscribedTracks: {
    audio: true,
    video: true
  }
});
```

### Network Quality Monitoring

```javascript
vapi.on('network-quality-change', (event) => {
  console.log('Network quality:', event);
});

vapi.on('network-connection', (event) => {
  console.log('Network connection:', event);
});
```

### Call Progress Tracking

```javascript
vapi.on('call-start-progress', (event) => {
  console.log(`Stage: ${event.stage}, Status: ${event.status}`);
});

vapi.on('call-start-success', (event) => {
  console.log('Call started successfully in', event.totalDuration, 'ms');
});

vapi.on('call-start-failed', (event) => {
  console.error('Call failed at stage:', event.stage, 'Error:', event.error);
});
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

vapi.on('camera-error', (error) => {
  console.error('Camera error:', error);
  Alert.alert('Camera Error', 'Unable to access camera');
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

#### 5. **TurboModules Issues**
```bash
# Disable TurboModules
cd android && echo 'newArchEnabled=false' >> gradle.properties && cd ..
```

### Debug Commands

```bash
# Clean iOS build
cd ios && xcodebuild clean && cd ..

# Clean Android build
cd android && ./gradlew clean && cd ..

# Reinstall dependencies
rm -rf node_modules && npm cache verify && npm install
```

## 🔗 Expo Integration

> **Warning**: This SDK cannot be used with Expo Go. Use Expo Development Build or EAS Build.

### Expo Setup

1. **Install dependencies**:
```bash
npx expo install @vapi-ai/react-native @daily-co/react-native-daily-js @react-native-async-storage/async-storage react-native-background-timer react-native-get-random-values
npm install --save-exact @daily-co/react-native-webrtc@118.0.3-daily.4
```

2. **Update app.json**:
```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.anonymous.ReactNativeWithExpo52",
      "infoPlist": {
        "NSCameraUsageDescription": "Vapi Playground needs camera access to work",
        "NSMicrophoneUsageDescription": "Vapi Playground needs microphone access to work",
        "UIBackgroundModes": ["voip"]
      }
    },
    "android": {
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.CAMERA",
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.WAKE_LOCK",
        "android.permission.BLUETOOTH",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_CAMERA",
        "android.permission.FOREGROUND_SERVICE_MICROPHONE",
        "android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION",
        "android.permission.POST_NOTIFICATIONS"
      ],
    },
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
            "deploymentTarget": "15.1"
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

#### Core Methods
- `start(assistant, overrides?)` - Start a voice/video call
- `stop()` - End the current call
- `send(message)` - Send a message during call
- `say(message, endCallAfterSpoken?, interruptionsEnabled?, interruptAssistantEnabled?)` - Have assistant speak

#### Audio Methods
- `setMuted(muted: boolean)` - Mute/unmute microphone
- `isMuted()` - Check if currently muted
- `getAudioDevices()` - Get available audio devices
- `setAudioDevice(deviceId)` - Set audio device
- `getCurrentAudioDevice()` - Get current audio device

#### Video Methods
- `setLocalVideo(enable: boolean)` - Enable/disable video
- `isVideoEnabled()` - Check if video is enabled
- `startCamera()` - Start camera before call
- `cycleCamera()` - Switch between cameras
- `getCameraDevices()` - Get available cameras
- `setCamera(deviceId)` - Set specific camera
- `getCurrentCameraDevice()` - Get current camera

#### Screen Sharing Methods
- `startScreenShare()` - Start screen sharing
- `stopScreenShare()` - Stop screen sharing

#### Participant Methods
- `participants()` - Get all participants
- `updateParticipant(sessionId, updates)` - Update participant settings

#### Advanced Methods
- `getDailyCallObject()` - Get underlying Daily call object
- `updateSendSettings(settings)` - Update send settings
- `updateReceiveSettings(settings)` - Update receive settings
- `updateInputSettings(settings)` - Update input settings

#### Events
- `call-start` - Call has started
- `call-end` - Call has ended
- `volume-level` - Volume level changed
- `speech-start` - Speech detection started
- `speech-end` - Speech detection ended
- `message` - Received message
- `error` - Error occurred
- `video` - Video track received
- `camera-error` - Camera error occurred
- `network-quality-change` - Network quality changed
- `network-connection` - Network connection status
- `daily-participant-updated` - Participant updated
- `call-start-progress` - Call initialization progress
- `call-start-success` - Call started successfully
- `call-start-failed` - Call failed to start

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License
Copyright (c) 2023 Vapi Labs Inc.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 🆘 Support

- **Documentation**: [Vapi Docs](https://docs.vapi.ai)
- **Issues**: [GitHub Issues](https://github.com/VapiAI/react-native-sdk/issues)
- **Discord**: [Vapi Community](https://discord.gg/vapi)
