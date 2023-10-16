import { CONFIG } from '@/lib/config'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { collectionId } = req.query as { collectionId: string }

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
    })
    const response = await eden.collections.get({ collectionId })
    return res.status(200).json({ collection: response.collection })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
