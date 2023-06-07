import { withSessionRoute } from '@/lib/withSession'
import jwt from 'jsonwebtoken'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req
  switch (method) {
    case 'GET':
      try {
        // Check if session token exists
        if (!req.session.token) {
          return res.status(401).json({ error: 'Unauthorized' })
        }

        // Verify session token
        const decodedToken = jwt.verify(
          req.session.token,
          process.env.COOKIE_SECRET as string,
        )
        if (!decodedToken) {
          return res.status(401).json({ error: 'Unauthorized' })
        }

        // Check expiration time
        const now = Math.floor(Date.now() / 1000) // Current time in seconds
        if (decodedToken.exp < now) {
          // Session token has expired
          return res.status(401).json({ error: 'Session expired' })
        }

        // Session is still valid, continue processing
        return res.status(200).json({
          address: req.session.address,
        })
      } catch (error) {
        console.error(error)
        res.status(401).json({ error: 'Unauthorized' })
      }
      break
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}

export default withSessionRoute(handler)
