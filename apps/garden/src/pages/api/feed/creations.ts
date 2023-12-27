import { FeedRouteQueryParams } from '@/hooks/useFeedPaginated'
import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { createPaginationRoute } from '@/lib/fetcher'
import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req

  const route = createPaginationRoute(
    `${CONFIG.API_URL}/feed/creations`,
    req.query as FeedRouteQueryParams,
  )

  switch (method) {
    case 'GET':
      try {
        // console.log('333', route(Number(limit), Number(page)))
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
