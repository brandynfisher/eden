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
```

This will start the Expo development server. You can then:

- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Press `w` to open in web browser
- Scan the QR code with Expo Go app on your device

For remote server:

```bash
npx expo start --tunnel
```

This will give you a URL to type or a QR code to scan which can be used to run the app on a device that is not connected to your network.

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

The app uses Clerk for authentication. Make sure to configure your Clerk keys in your environment or configuration file.

The app supports automatic dark/light mode based on system preferences and can be configured in `app.json`.

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

## License

Private - See root LICENSE file
