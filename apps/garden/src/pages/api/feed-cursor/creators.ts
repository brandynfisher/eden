import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { queryObjectToString } from '@/lib/fetcher'
import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req

  const route = `${CONFIG.API_URL}/feed-cursor/creators?${queryObjectToString(
    req.query,
  )}`

  switch (method) {
    case 'GET':
      try {
        const response = await axios.get(route, {
          headers: await getAuthHeaders(req),
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

export default handler
