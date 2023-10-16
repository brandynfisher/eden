import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { sessionId } = req.query as { sessionId: string }
  const authToken = await getAuthToken(req)

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      token: authToken,
    })
    const response = await eden.sessions.events.list({
      sessionId,
    })
    return res.status(200).json({ sessions: response.docs })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
