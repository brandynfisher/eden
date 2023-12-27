import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { CharactersTestArguments, EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getAuthToken(req)
  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  const { assistant, interaction } = req.body as CharactersTestArguments

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      apiKey: CONFIG.EDEN_ADMIN_API_KEY,
      apiSecret: CONFIG.EDEN_ADMIN_API_SECRET,
    })
    const response = await eden.characters.test({
      assistant,
      interaction,
    })
    return res.status(200).json({
      message: response.message,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
