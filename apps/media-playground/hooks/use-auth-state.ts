import { useMe } from '@/hooks/use-me'
import { env, siteConfig } from '@/lib/config'
import { useAuth, useClerk } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from 'next-themes'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

const publicRoutePatterns = siteConfig.publicRoutes.map(route =>
  route.length > 1 ? `^${route}.*$` : `^${route}$`,
)

export function useAuthState() {
  const { openSignIn } = useClerk()
  const { isSignedIn } = useAuth()
  const { resolvedTheme } = useTheme()
  const clerkTheme = resolvedTheme === 'light' ? undefined : dark

  const {
    user,
    balance,
    foreverBalance,
    subscriptionBalance,
    hasMinimumSubscriptionTier,
    hasEden2EarlyAccess,
    isLoading,
  } = useMe({ isAuthenticated: !!isSignedIn })

  const router = useRouter()
  const pathname = usePathname()

  // console.log('use-auth-state', { pathname, isPublic: publicRoutes.some((route) => pathname.match(new RegExp(route))) })
  useEffect(() => {
    // Return early during loading
    if (isLoading) {
      return
    }

    // Verify that the current pathname is valid by running regexes in publicRoutes against it
    const isPublicRoute = publicRoutePatterns.some(route => {
      const regex = new RegExp(route)
      return Boolean(pathname.match(regex))
    })

    // If it's a public route or the user isn't signed in, there's nothing more to do
    if (isPublicRoute || !isSignedIn) {
      return
    }

    const hasAccessFlag = hasEden2EarlyAccess()
    const unauthenticatedRoutes = ['/concierge', '/sign-up', '/sign-in']
    const shouldRedirectToHome =
      hasAccessFlag && unauthenticatedRoutes.includes(pathname)

    // If the user is signed in and has early access, they should not be on unauthenticated routes
    if (shouldRedirectToHome) {
      router.push('/')
      return
    }

    if (isSignedIn && !hasAccessFlag) {
      router.push('/concierge')
    }
  }, [isLoading, pathname, router, hasEden2EarlyAccess, isSignedIn])

  const verifyAuth = async () => {
    if (isSignedIn && hasEden2EarlyAccess()) {
      return true
    }

    if (!hasEden2EarlyAccess()) {
      console.log('verifying auth redirect')
      window.location.href = '/concierge'
      return false
    }

    openSignIn(
      clerkTheme
        ? {
            fallbackRedirectUrl: env.NEXT_PUBLIC_HOST,
            signUpFallbackRedirectUrl: env.NEXT_PUBLIC_HOST,
            appearance: { baseTheme: clerkTheme },
          }
        : undefined,
    )
    return false
  }

  return {
    verifyAuth,
    user,
    balance,
    foreverBalance,
    subscriptionBalance,
    hasMinimumSubscriptionTier,
    hasEden2EarlyAccess,
    isSignedIn,
  }
}
