import { CONFIG } from '@/lib/config'
import { getAdminHeaders } from '@/lib/fetcher'
import { withSessionRoute } from '@/lib/withSession'
import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const challengeRoute = `${CONFIG.API_URL}/admin/auth/challenge`
  const headers = getAdminHeaders()
  const { method } = req
  switch (method) {
    case 'POST':
      try {
        const { address, isWeb2 } = req.body
        const response = await axios.post(
          challengeRoute,
          {
            address,
            isWeb2,
          },
          { headers },
        )
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
