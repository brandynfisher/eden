import { CONFIG } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' })
  }

  const { taskId } = req.body

  try {
    await axios.post(
      `${CONFIG.API_URL}/tasks/update?secret=${process.env.API_WEBHOOK_SECRET}`,
      {
        id: taskId,
      },
    )
    return res.status(204).end()
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return res.status(500).json({ message: errorMessage })
  }
}

export default handler
