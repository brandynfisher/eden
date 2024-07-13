import { useAuth } from '@clerk/nextjs'
import { useClerk } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from 'next-themes'

// @todo: should that be a context provider instead to make sure we're operating on a singleton?
export function useAuthState() {
  const { openSignIn } = useClerk()
  const { isSignedIn } = useAuth()
  const { theme } = useTheme()
  const clerkTheme = theme === 'dark' ? dark : undefined

  const verifyAuth = async () => {
    if (isSignedIn) {
      return true
    }

    openSignIn(
      clerkTheme ? { appearance: { baseTheme: clerkTheme } } : undefined,
    )
    return false
  }

  return {
    verifyAuth,
  }
}
