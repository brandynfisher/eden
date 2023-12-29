import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
import { CharactersTestArguments, EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getAuthToken(req)
  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  const { name, identity, prompt, knowledge, knowledge_summary, attachments } =
    req.body as CharactersTestArguments

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      apiKey: CONFIG.EDEN_ADMIN_API_KEY,
      apiSecret: CONFIG.EDEN_ADMIN_API_SECRET,
    })
    const response = await eden.characters.test({
      name,
      identity,
      prompt,
      knowledge,
      knowledge_summary,
      attachments,
    })
    return res.status(200).json({
      message: response.message,
    })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return res.status(500).json({ message: errorMessage })
  }
}

export default handler
