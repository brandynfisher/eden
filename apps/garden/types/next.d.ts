import { IronSessionData } from 'iron-session'

declare module 'next' {
  interface NextApiRequest {
    session: IronSessionData & { token: string }
  }
}
