import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
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
    const response = await eden.session.events.list({
      sessionId,
    })
    return res.status(200).json({ sessions: response.docs })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return res.status(500).json({ message: errorMessage })
  }
}

export default handler
