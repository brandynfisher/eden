import { CONFIG } from '@/lib/config'
import { withSessionRoute } from '@/lib/withSession'
import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const loginRoute = `${CONFIG.API_URL}/auth/login`
  const { method } = req
  switch (method) {
    case 'POST':
      try {
        const { address, message, signature } = req.body
        const response = await axios.post(loginRoute, {
          address,
          message,
          signature,
        })
        const { token } = response.data
        req.session.token = token
        await req.session.save()
        return res.status(200).json({ success: true })
      } catch (_error) {
        res.status(401).json({ error: 'Unauthorized' })
      }
      break
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}

export default withSessionRoute(handler)
