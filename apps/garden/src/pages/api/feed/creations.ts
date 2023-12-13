import { FeedRouteQueryParams } from '@/hooks/useFeedPaginated'
import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'

export const createPaginationRoute = (
  baseUrl: string,
  query: FeedRouteQueryParams,
) => {
  const basePath = baseUrl
  const params: FeedRouteQueryParams = {}

  if (query.limit && query.page) {
    params.page = query.page
    params.limit = query.limit
  }
  if (query.userId) {
    params.userId = String(query.userId)
  }
  if (query.characterId) {
    params.characterId = String(query.characterId)
  }
  if (query.conceptId) {
    params.conceptId = String(query.conceptId)
  }
  if (query.name && query.name.length > 0) {
    params.name = String(query.name)
  }
  if (query.collectionId) {
    params.collectionId = String(query.collectionId)
  }
  if (query.orderBy) {
    params.orderBy = String(query.orderBy)
  }
  if (query.direction) {
    params.direction = Number(query.direction)
  }

  const queryString = Object.keys(params)
    //@ts-ignore
    .map(key => `${key}=${params[key]}`)
    .join('&')

  return queryString ? `${basePath}?${queryString}` : basePath
}

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
