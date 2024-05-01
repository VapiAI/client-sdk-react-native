# Vapi React Native SDK

This package lets you start Vapi calls directly in your React native.

## Warning

> This guide is for bare bone react native project if you use **expo build** skip this section to [Expo guide](#expo-guide)

## Minimum OS/SDK versions

This package introduces some constraints on what OS/SDK versions your project can support:

- **iOS**: Deployment target >= 12.0
- **Android**: `minSdkVersion` >= 24

## Installation

Install `@vapi-ai/react-native` along with its peer dependencies:

```bash
npm i @vapi-ai/react-native @daily-co/react-native-daily-js @react-native-async-storage/async-storage@^1.15.7 react-native-background-timer@^2.3.1 react-native-get-random-values@^1.9.0
npm i --save-exact @daily-co/react-native-webrtc@118.0.3-daily.1
```

Then, follow the below steps to set up your native project on each platform. **Note that these steps assume you're using a version of React Native that supports autolinking (>= 60).**

### iOS

Update the `platform` in your `Podfile`, since `@daily-co/react-native-webrtc` only works on iOS 12 and above:

```ruby
platform :ios, '12.0'
```

> If you wish to **send screen share** from iOS, it only works on **iOS 14** and above. Therefore, in this case, please switch to using iOS 14.0 instead of iOS 12.0.

Then run:

```bash
npx pod-install
```

Next, you will need to update your project's `Info.plist` to add three new rows with the following keys:

- `NSCameraUsageDescription`
- `NSMicrophoneUsageDescription`
- `UIBackgroundModes`

For the first two key's values, provide user-facing strings explaining why your app is asking for camera and microphone access. **Note that the app will simply crash silently without these.**

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
    ...
</dict>
```

### Android

Add the following to `AndroidManifest.xml`:

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

Update your `minSdkVersion` in your top-level `build.gradle` file:

```groovy
minSdkVersion = 24
```

(If you run into any issues, refer to [Github issues](https://github.com/react-native-webrtc/react-native-webrtc/issues/720) like [these](https://github.com/jitsi/jitsi-meet/issues/4778), or the `react-native-webrtc` [installation docs](https://github.com/react-native-webrtc/react-native-webrtc/blob/master/Documentation/AndroidInstallation.md), which walk you through a more complicated process. The simpler process laid out above seems to work in a vanilla modern React Native CLI-based setup).

# Expo Guide

To add Vapi react native SDK to your existing react native expo project

> **Warning:** This project cannot be used with an Expo Go app because it requires custom native code.

1. update your current existing dependencies in package.json to the exact version as showing below

```
"expo": "^50",
"react-native": "^0.73.6",
```

2. Add new dependencies to your package.json with exact version as showing below

```
"@vapi-ai/react-native": "^0.1.7",
"@config-plugins/react-native-webrtc": "8.0.0",
"@daily-co/config-plugin-rn-daily-js": "0.0.4",
"@daily-co/react-native-daily-js": "0.59.0",
"@daily-co/react-native-webrtc": "118.0.3-daily.1",
"@react-native-async-storage/async-storage": "^1.22.3",
"react-native-background-timer": "^2.4.1",
"react-native-get-random-values": "^1.11.0",
```

3. Update app.json

````
{
    "expo": {

        ...

        "ios": {
        "supportsTablet": true,
        "bundleIdentifier": "co.vapi.DailyPlayground",
        "infoPlist": {
            "UIBackgroundModes": [
            "voip"
            ]
        },
        "bitcode": false
        }

    ...

  }

    ...

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

4. prepare expo build `npx expo prebuild`

5. Install iOS pods with `npx pod-install`

6. Set up your `.env` file with the required Vapi tokens.

7. Run the local server with `npx expo run:ios`.



## Usage

First, import the Vapi class from the package:

```javascript
import Vapi from '@vapi-ai/react-native';
````

Then, create a new instance of the Vapi class, passing your Public Key as a parameter to the constructor:

```javascript
const vapi = new Vapi('your-public-key');
```

You can start a new call by calling the `start` method and passing an `assistant` object or `assistantId`:

```javascript
vapi.start({
  model: {
    provider: "openai",
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are an assistant.",
      },
     ],
   }
   voice: {
    provider: "11labs",
    voiceId: "burt",
  },
  ...
});
```

```javascript
vapi.start('your-assistant-id');
```

The `start` method will initiate a new call.

You can override existing assistant parameters or set variables with the `assistant_overrides` parameter.
Assume the first message is `Hey, {{name}} how are you?` and you want to set the value of `name` to `John`:

```javascript
const assistantOverrides = {
  recordingEnabled: false,
  variableValues: {
    name: 'John',
  },
};

vapi.start({
  assistantId: 'your-assistant-id',
  assistantOverrides: assistantOverrides,
});
```

You can also send text messages to the assistant aside from the audio input using the `send` method and passing appropriate `role` and `content`.

```javascript
vapi.send({
  type: 'add-message',
  message: {
    role: 'system',
    content: 'The user has pressed the button, say peanuts',
  },
});
```

Possible values for the role are `system`, `user`, `assistant`, `tool` or `function`.

You can stop the session by calling the `stop` method:

```javascript
vapi.stop();
```

This will stop the recording and close the connection.

The `setMuted(muted: boolean)` can be used to mute and un-mute the user's microphone.

```javascript
vapi.isMuted(); // false
vapi.setMuted(true);
vapi.isMuted(); // true
```

## Events

You can listen to the following events:

```javascript
vapi.on('speech-start', () => {
  console.log('Speech has started');
});

vapi.on('speech-end', () => {
  console.log('Speech has ended');
});

vapi.on('call-start', () => {
  console.log('Call has started');
});

vapi.on('call-end', () => {
  console.log('Call has stopped');
});

// Function calls and transcripts will be sent via messages
vapi.on('message', (message) => {
  console.log(message);
});

vapi.on('error', (e) => {
  console.error(e);
});
```

These events allow you to react to changes in the state of the call or speech.

## License

```
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
```
