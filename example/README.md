# react-native-nitro-lndltc example

Example app demonstrating the `react-native-nitro-lndltc` library.

## Prerequisites

- Bun
- iOS: Xcode 16+, CocoaPods
- Android: Android Studio, NDK 27+

## Setup

```bash
cd example
bun install
```

## Download liblnd

Download the prebuilt liblnd binaries from:

**https://static.nexuswallet.com/lndmobile/**

### iOS

Download `liblnd-ios.zip`, extract it, and place the `liblnd-*.a` library at:

```
example/
  ios/
    liblnd.a          <-- place here
```

For physical devices, use `liblnd-fat.a` (renamed to `liblnd.a`).
For the simulator on Apple Silicon, use `liblnd-simulator-amd64.a` (renamed to `liblnd.a`).

### Android

Download the liblnd `.so` files for each architecture and place them at:

```
example/
  android/
    app/
      src/
        main/
          jniLibs/
            arm64-v8a/
              liblnd.so       <-- place here
            armeabi-v7a/
              liblnd.so       <-- place here
            x86/
              liblnd.so       <-- place here
            x86_64/
              liblnd.so       <-- place here
```

## Build

### iOS

```bash
bun run pods
bun run ios
```

Or open `ios/example.xcworkspace` in Xcode and build from there.

### Android

```bash
bun run android
```

Or open the `android/` directory in Android Studio and build from there.
