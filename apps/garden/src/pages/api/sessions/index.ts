import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { withSessionRoute } from '@/lib/withSession'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = getAuthToken(req)
  const { sessionId } = req.query as { sessionId: string }

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      token: authToken,
    })
    const response = await eden.sessions.get({
      sessionId: sessionId,
    })
    return res.status(200).json({ session: response.session })
  } catch (error) {
    console.error(error)
    return res.status(500).json(error || { error: 'Internal server error' })
  }
}

export default withSessionRoute(handler)
