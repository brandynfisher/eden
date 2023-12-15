import { getAuthUserId } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const userId = await getAuthUserId(req)
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const { characterId } = req.body
  console.log('characterId', characterId)

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      apiKey: CONFIG.EDEN_ADMIN_API_KEY,
      apiSecret: CONFIG.EDEN_ADMIN_API_SECRET,
    })
    const response = await eden.sessions.create({})
    const { sessionId } = response

    if (!sessionId) {
      return res.status(500).json({ error: 'Failed to create session' })
    }

    await eden.sessions.users.add({
      sessionId,
      userIds: [userId],
    })

    await eden.sessions.characters.add({
      sessionId,
      characterIds: [characterId],
    })
    return res.status(200).json({ sessionId: response.sessionId })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
