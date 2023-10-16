import { CONFIG } from '@/lib/config'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = req.session.token

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      token: authToken,
    })
    const response = await eden.characters.list({})
    return res.status(200).json({ characters: response.docs })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
