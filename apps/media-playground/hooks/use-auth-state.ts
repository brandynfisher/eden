import { useMe } from '@/hooks/use-me'
import { useAuth, useClerk } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from 'next-themes'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

const publicRoutes = [
  '^/$',
  '^/sign-in.*$',
  '^/sign-up.*$',
  '^/concierge.*$',
  '^/(api|trpc).*$',
  '^/creators.*$',
  '^/creations.*$',
]

export function useAuthState() {
  const { openSignIn } = useClerk()
  const { isSignedIn } = useAuth()
  const { theme } = useTheme()
  const clerkTheme = theme === 'dark' ? dark : undefined

  const {
    user,
    balance,
    foreverBalance,
    subscriptionBalance,
    hasMinimumSubscriptionTier,
    hasEden2EarlyAccess,
  } = useMe({ isAuthenticated: !!isSignedIn })

  const router = useRouter()
  const pathname = usePathname()

  // console.log('use-auth-state', { pathname, isPublic: publicRoutes.some((route) => pathname.match(new RegExp(route))) })
  useEffect(() => {
    // verify that the current pathname is valid by running regexes in publicRoutes against it
    const isPublicRoute = publicRoutes.some(route => {
      const regex = new RegExp(route)
      const match = pathname.match(regex)
      // console.log({ match, pathname, route })
      return match
    })

    // console.log({ isPublicRoute, isSignedIn, access: hasEden2EarlyAccess() })
    if (!isPublicRoute && (!isSignedIn || !hasEden2EarlyAccess())) {
      router.push('/concierge')
    }
  }, [pathname, router, hasEden2EarlyAccess, isSignedIn])

  const verifyAuth = async () => {
    if (isSignedIn) {
      return true
    }

    if (!hasEden2EarlyAccess()) {
      window.location.href = '/concierge'
      return false
    }

    openSignIn(
      clerkTheme ? { appearance: { baseTheme: clerkTheme } } : undefined,
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
    isSignedIn,
  }
}
