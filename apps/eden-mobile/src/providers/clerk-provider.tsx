import { config } from '@/lib/config'
import { ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { PropsWithChildren } from 'react'

export function ClerkProviderWrapper({ children }: PropsWithChildren) {
  if (!config.CLERK_PUBLISHABLE_KEY) {
    throw new Error(
      'Missing Clerk Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your environment variables.',
    )
  }

  return (
    <ClerkProvider
      publishableKey={config.CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      {children}
    </ClerkProvider>
  )
}
