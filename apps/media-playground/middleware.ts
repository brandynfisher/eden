import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware({ debug: false })

export const config = {
  apiRoutes: ['/(api|trpc)(.*)'],
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
