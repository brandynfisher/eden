import { authMiddleware } from '@clerk/nextjs/server'

export default authMiddleware({ publicRoutes: ['/', '/(.*)'] })

export const config = {
  matcher: ['/((?!.*\\..*|_next|sign-in).*)', '/', '/(api|trpc)(.*)'],
}
