import { getAuthToken, getAuthUserId } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { ChatMessage } from '@/lib/types'
import { EdenClient, SessionEventType } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

type CharacterChatCompletionRequest = {
  sessionId: string
  characterId: string
  description: string
  dialogue: ChatMessage[]
  previousMessages: ChatMessage[]
  message: ChatMessage
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const userId = await getAuthUserId(req)
  const authToken = await getAuthToken(req)
  const {
    sessionId,
    characterId,
    description,
    dialogue,
    previousMessages,
    message,
  } = req.body as CharacterChatCompletionRequest

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

    const systemMessage = {
      sender: 'system',
      message: description,
    }

    const chat = [systemMessage, ...dialogue, ...previousMessages, message]

    const response = await eden.tasks.chat({
      chat,
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
            userId: userId,
            message: message.message,
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

export default handler
