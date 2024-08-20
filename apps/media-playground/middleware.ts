import { env, siteConfig } from '@/lib/config'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(
  siteConfig.publicRoutes.map(route =>
    route.length > 1 ? `${route}(.*)` : route,
  ),
)

export default clerkMiddleware(
  (auth, request) => {
    if (!isPublicRoute(request)) {
      // console.log('not a public route, protect it', auth().userId, request.url)
      if (!auth().userId) {
        console.log('non valid user, send back to sign-in')
        return NextResponse.redirect(`${env.NEXT_PUBLIC_HOST}/concierge`)
        // return redirect('/concierge')
      }
    }
  },
  { debug: false },
)

// export default clerkMiddleware({ debug: false })

export const config = {
  apiRoutes: ['/(api|trpc)(.*)'],
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
