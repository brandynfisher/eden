import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { EdenClient, SessionsInteractArguments } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getAuthToken(req)
  const { sessionId, assistant, interaction } =
    req.body as SessionsInteractArguments

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  console.log('sessionId', sessionId)
  console.log('assistant', assistant)
  console.log('interaction', interaction)

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      apiKey: CONFIG.EDEN_ADMIN_API_KEY,
      apiSecret: CONFIG.EDEN_ADMIN_API_SECRET,
    })
    const response = await eden.sessions.interact({
      sessionId,
      assistant,
      interaction,
    })
    return res.status(200).json({
      message: response.message,
      config: response.config,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
