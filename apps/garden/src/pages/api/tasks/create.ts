import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient, Task } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const createTask = async (
  generatorName: string,
  config: Task['config'],
  req: NextApiRequest,
  res: NextApiResponse,
  eden: EdenClient
) => {
  await eden.tasks.create({
    generatorName,
    config,
  }).then((response) => {
    // console.log('then', response)
    if (!response || response.message) {
      return res.status(500).json({ message: response.message || 'Internal Error - unknown' })
    }

    if (response && !response.taskId) {
      return res.status(404).json({ message: response.message || `Could not create task` })
    }

    return res.status(200).json({ taskId: response.taskId })
  })
  .catch((error) => {
    // console.log('catch', error, error.response.data)
    return res.status(req.statusCode || 500).json({
      message: error?.response?.data?.message || 'Internal Exception',
      error: error,
    })
  })
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getAuthToken(req)
  const { generatorName, config } = req.body

  if (!authToken) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      token: authToken,
    })

    if (req.method === 'POST') {
      return createTask(generatorName, config, req, res, eden)
    }

    return res.status(501).json({ message: `HTTP ${req.method} not implemented` })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return res.status(500).json({ message: errorMessage })
  }
}

export default handler
