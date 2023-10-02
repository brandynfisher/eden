import { FeedRouteQueryParams } from '@/hooks/useFeedPaginated'
import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { withSessionRoute } from '@/lib/withSession'
import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req

  const { userId, page, limit, orderBy, direction } = req.query
  const authToken = await getAuthToken(req)

  const route = (limit: number, page: number) => {
    const basePath = `${CONFIG.API_URL}/feed/concepts`
    const params: FeedRouteQueryParams = {}

    if (limit && page) {
      params.page = page
      params.limit = limit
    }

    if (userId) {
      params.userId = String(userId)
    }
    if (orderBy) {
      params.orderBy = String(orderBy)
    }
    if (direction) {
      params.direction = Number(direction)
    }

    const queryString = Object.keys(params)
      //@ts-ignore
      .map(key => `${key}=${params[key]}`)
      .join('&')

    return queryString ? `${basePath}?${queryString}` : basePath
  }

  switch (method) {
    case 'GET':
      try {
        const headers = authToken
          ? {
              Authorization: `Bearer ${authToken}`,
            }
          : {}
        const response = await axios.get(route(Number(limit), Number(page)), {
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
