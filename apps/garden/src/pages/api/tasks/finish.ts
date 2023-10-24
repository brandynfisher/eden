import { CONFIG } from '@/lib/config'
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
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
