import { getAuthToken } from '@/lib/auth'
import { withSessionRoute } from '@/lib/withSession'
import jwt from 'jsonwebtoken'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getAuthToken(req)
  const { method } = req

  switch (method) {
    case 'GET':
      try {
        // Check if session token exists
        if (!authToken) {
          return res.status(200).json({ error: 'Unauthorized' })
        }

        // Verify session token
        const decodedToken = jwt.verify(
          authToken,
          process.env.COOKIE_SECRET as string,
        )
        if (!decodedToken) {
          return res.status(200).json({ error: 'Unauthorized' })
        }

        // Session is still valid, continue processing
        return res.status(200).json({
          address: req.session.address,
        })
      } catch (error) {
        console.error(error)
        res.status(200).json({ error: 'Unauthorized' })
      }
      break
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}

export default withSessionRoute(handler)
