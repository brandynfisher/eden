import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { withSessionRoute } from '@/lib/withSession'
import { EdenClient, SessionEventType } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getAuthToken(req)
  const { sessionId, characterId, prompt } = req.body

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      token: authToken,
    })

    const edenAdmin = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      apiKey: CONFIG.EDEN_ADMIN_API_KEY,
      apiSecret: CONFIG.EDEN_ADMIN_API_SECRET,
    })

    const response = await eden.tasks.complete({
      prompt,
    })

    const completion = response.completion

    if (!completion) {
      return res.status(500).json({ error: 'Internal server error' })
    }

    if (sessionId) {
      await edenAdmin.sessions.update({
        sessionId,
        type: SessionEventType.USER_MESSAGE,
        data: {
          userMessage: {
            userId: req.session.address,
            message: prompt,
            completion: completion.id,
          },
        },
      })

      await edenAdmin.sessions.update({
        sessionId,
        type: SessionEventType.CHARACTER_MESSAGE,
        data: {
          characterMessage: {
            character: characterId,
            message: completion.text,
            completion: completion.id,
          },
        },
      })
    }

    return res.status(200).json({ completion: completion.text })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withSessionRoute(handler)
