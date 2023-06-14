import { CONFIG } from '@/lib/config'
import { withSessionRoute } from '@/lib/withSession'
import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const challengeRoute = `${CONFIG.API_URL}/auth/challenge`
  const { method } = req
  switch (method) {
    case 'POST':
      try {
        const { address, isWeb2 } = req.body
        const response = await axios.post(challengeRoute, {
          address,
          isWeb2,
        })
        return res.status(200).json(response.data)
      } catch (_error) {
        console.error(_error)
        res.status(401).json({ error: 'Unauthorized' })
      }
      break
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}

export default withSessionRoute(handler)
