import { Platform } from 'react-native'

const LOCAL_API_HOST = Platform.select({
  ios: 'http://127.0.0.1:5050',
  android: 'http://10.0.2.2:5050',
  default: 'http://localhost:5050',
})

export const config = {
  API_URL: process.env.EXPO_PUBLIC_EDEN_API_URL ?? LOCAL_API_HOST,
  CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
}
