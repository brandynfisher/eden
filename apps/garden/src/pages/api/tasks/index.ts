import { PaginatedRouteQueryParams } from '@/hooks/useFeedPaginated'
import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getAuthToken(req)
  const { type, taskIds, status, page, limit } = req.query as {
    type?: 'concepts' | 'creations'
    taskIds?: string
    status?: string
  } & PaginatedRouteQueryParams
  const taskIdList = taskIds && taskIds.split(',')
  const statusList = status && status.split(',')

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      token: authToken,
    })
    const response = await eden.tasks.list({
      status: statusList,
      taskId: taskIdList,
      type,
      page,
      limit,
    })
    return res.status(200).json(response)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
