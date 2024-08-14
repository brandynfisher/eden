import { env } from '@/lib/config'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
// import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/concierge(.*)',
  '/(api|trpc)(.*)',
  '/creators(.*)',
  '/creations(.*)',
])

export default clerkMiddleware(
  (auth, request) => {
    if (!isPublicRoute(request)) {
      console.log('not a public route, protect it', auth().userId, request.url)
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
