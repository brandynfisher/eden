import { FeedRouteQueryParams } from '@/hooks/useFeedPaginated'
import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { createPaginationRoute, handleAxiosServerError } from '@/lib/fetcher'
import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req

  const route = createPaginationRoute(
    `${CONFIG.API_URL}/feed/characters`,
    req.query as FeedRouteQueryParams,
  )

  switch (method) {
    case 'GET':
      try {
        const response = await axios.get(route, {
          headers: await getAuthHeaders(req),
        })
        return res.status(200).json(response.data)
      } catch (error) {
        const errorMessage = handleAxiosServerError(error)
        console.error(errorMessage)
        return res.status(500).json({ message: errorMessage })
      }
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}

export default handler
