import { CONFIG } from '@/lib/config'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { userId } = req.query as { userId: string }

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
    })

    const response = await eden.concepts.list({
      userId: userId,
    })

    return res.status(200).json({ concepts: response.docs })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
