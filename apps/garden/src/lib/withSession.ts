import { withIronSessionApiRoute } from 'iron-session/next'
import { NextApiHandler } from 'next'

declare module 'iron-session' {
  interface IronSessionData {
    token?: string
    address?: string
  }
}

const sessionOptions = {
  password: process.env.COOKIE_SECRET as string,
  cookieName: 'eden_app',
  ttl: 15 * 24 * 3600,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}

export function withSessionRoute(handler: NextApiHandler) {
  return withIronSessionApiRoute(handler, sessionOptions)
}
