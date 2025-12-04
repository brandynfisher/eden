# Eden Mobile

A React Native mobile application built with Expo for iOS, Android, and Web.

## Stack

- **Expo** - React Native framework
- **React Native** - Mobile app framework
- **TypeScript** - Type safety
- **Clerk** - Authentication
- **React Navigation** - Navigation
- **Eden React SDK** - Eden API integration

## Features

- 🔐 Authentication with Clerk (sign in, sign up, OTP verification)
- 🤖 Agents list and management
- 🌓 Dark/Light mode support
- 📱 Cross-platform (iOS, Android, Web)
- 🎨 Custom Inter font family
- 📐 Responsive design

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Yarn package manager
- Expo CLI (optional, can use npx)

### Installation

Install dependencies:

```bash
yarn install
```

### Running the App

Start the development server:

```bash
yarn dev:eden
# or
yarn start
```

This will start the Expo development server and display a QR code.

## Preview Methods

### Method 1: Expo Go App (Recommended for Quick Testing)

**Best for**: Quick testing, sharing with team members, testing on physical devices

1. Install **Expo Go** app on your iOS/Android device:

   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Start the development server: `yarn dev:eden`

3. Scan the QR code:
   - **iOS**: Open Camera app and scan the QR code
   - **Android**: Open Expo Go app and tap "Scan QR code"

**Pros**: No build required, works on physical devices instantly, easy to share, hot reload enabled  
**Cons**: Limited to Expo SDK features, some native modules may not work, slower than development builds

### Method 2: iOS Simulator (macOS Only)

**Best for**: iOS development, testing iOS-specific features

1. Make sure you have Xcode installed
2. Start the development server: `yarn dev:eden`
3. Press `i` in the terminal or run: `yarn ios`

**Pros**: Fast and reliable, full iOS features available, easy debugging  
**Cons**: macOS only, requires Xcode installation

### Method 3: Android Emulator

**Best for**: Android development, testing Android-specific features

1. Install Android Studio and set up an emulator
2. Start the development server: `yarn dev:eden`
3. Press `a` in the terminal or run: `yarn android`

**Pros**: Full Android features available, easy debugging, multiple device configurations  
**Cons**: Requires Android Studio setup, emulator can be slow

### Method 4: Development Build (Most Native Experience)

**Best for**: Testing production-like experience, testing custom native modules

**iOS**:

```bash
npx expo run:ios
# Or: eas build --profile development --platform ios
```

**Android**:

```bash
npx expo run:android
# Or: eas build --profile development --platform android
```

**Pros**: Full native capabilities, production-like experience, all native modules work  
**Cons**: Requires build time, more complex setup

### Method 5: Web Browser (Limited)

**Best for**: Quick UI testing, web-specific features

1. Start the development server: `yarn dev:eden`
2. Press `w` in the terminal or run: `yarn web`

**Pros**: Instant preview, easy debugging with browser DevTools  
**Cons**: Limited mobile features, WebView won't work properly

### Remote Testing (Tunnel Mode)

For testing on devices not on the same network:

```bash
npx expo start --tunnel
```

This gives you a URL or QR code that works from anywhere (slower but more flexible).

# Code Architecture

```
src/
├── components/     # Reusable UI components
│   └── auth/       # Authentication components
├── features/       # Feature-specific components
│   └── agents/     # Agents list feature
├── hooks/          # Custom React hooks
├── providers/      # Context providers
├── styles/         # Style definitions
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── constants/      # App constants (theme, etc.)
```

## Configuration

### Environment Variables

Create a `.env` file in `apps/eden-mobile/`:

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
EXPO_PUBLIC_EDEN_API_URL=your_api_url  # Optional, defaults to localhost
```

The app uses Clerk for authentication. Make sure to configure your Clerk keys in your environment or configuration file.

The app supports automatic dark/light mode based on system preferences and can be configured in `app.json`.

## Testing WebView with Local Development Server

The app's main feature is a WebView that loads the Eden web app. To test this properly:

1. **Start the Eden web app locally** (from `apps/media-playground`):

   ```bash
   cd apps/media-playground
   yarn dev
   # Server should run on http://localhost:3000
   ```

2. **For iOS Simulator**: The app automatically uses `http://localhost:3000` - no configuration needed

3. **For Android Emulator**: The app uses `http://10.0.2.2:3000` (default emulator host) - no configuration needed

4. **For Physical Android Device**:
   - Update `ANDROID_LOCAL_IP` in `src/screens/webview/index.tsx`
   - Find your computer's local IP:
     ```bash
     # macOS/Linux
     ifconfig | grep "inet " | grep -v 127.0.0.1
     # Windows
     ipconfig
     ```
   - Update the constant: `const ANDROID_LOCAL_IP = '192.168.1.XXX'`
   - Make sure your device is on the same WiFi network

## Development

This app is part of the Eden monorepo. To run it alongside other Eden services:

```bash
# From the root directory
yarn dev:eden
```

## Building

### iOS

```bash
expo build:ios
```

### Android

```bash
expo build:android
```

For more build options, see the [Expo documentation](https://docs.expo.dev/build/introduction/).

## Troubleshooting

### WebView Not Loading

1. Check network connection: The app checks for internet connectivity
2. Verify URL: Check `WEB_URL` in `src/screens/webview/index.tsx`
3. Check console: Look for errors in Metro bundler or device logs
4. For Android: Ensure `ANDROID_LOCAL_IP` is set correctly for physical devices

### App Crashes on Launch

1. Clear cache: `npx expo start -c`
2. Reinstall dependencies: `rm -rf node_modules && yarn install`
3. Reset Expo cache: `npx expo start --clear`

### Fonts Not Loading

- Ensure all font files exist in `assets/fonts/`
- Check font names match in `App.tsx` and `app.json`

### Permission Issues

- **iOS**: Check `Info.plist` permissions in `app.json`
- **Android**: Check `AndroidManifest.xml` permissions (auto-generated from `app.json`)

## Quick Commands Reference

```bash
# Start development server
yarn dev:eden

# iOS simulator
yarn ios

# Android emulator
yarn android

# Web browser
yarn web

# Clear cache and start
npx expo start -c

# Start with tunnel (remote access)
npx expo start --tunnel

# Build development client (iOS)
npx expo run:ios

# Build development client (Android)
npx expo run:android
```

## Best Practices

1. Always test on physical devices before considering production
2. Test both iOS and Android - behavior can differ significantly
3. Test with real network conditions (slow 3G, offline, etc.)
4. Test permission flows - camera, photo library, etc.
5. Test onboarding flow - clear app data to test fresh installs
6. Monitor performance - use React Native Debugger or Flipper
7. Test WebView functionality - ensure it works with both local and production URLs

## License

Private - See root LICENSE file
