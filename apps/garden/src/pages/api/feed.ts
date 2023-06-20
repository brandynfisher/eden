import { CONFIG } from '@/lib/config'
import { withSessionRoute } from '@/lib/withSession'
import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req
  const { userId, collectionId } = req.query
  const authToken = req.session.token

  const route = () => {
    let base = `${CONFIG.API_URL}/feed`
    if (userId) {
      base += `?userId=${userId}`
    }
    if (collectionId) {
      base += `?collectionId=${collectionId}`
    }
    return base
  }

  switch (method) {
    case 'GET':
      try {
        const headers = authToken
          ? {
              Authorization: `Bearer ${authToken}`,
            }
          : {}
        const response = await axios.get(route(), {
          headers,
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
