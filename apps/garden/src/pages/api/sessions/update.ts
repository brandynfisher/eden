import { CONFIG } from '@/lib/config'
import { getSessionCookie } from '@/lib/fetcher'
import { withSessionRoute } from '@/lib/withSession'
import { EdenClient, SessionsUpdateArguments } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getSessionCookie(req)
  const { sessionId, type, data } = req.body as SessionsUpdateArguments

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      apiKey: CONFIG.EDEN_ADMIN_API_KEY,
      apiSecret: CONFIG.EDEN_ADMIN_API_SECRET,
    })
    const response = await eden.sessions.update({
      sessionId,
      type,
      data,
    })
    return res.status(200).json({ eventId: response.eventId })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withSessionRoute(handler)
