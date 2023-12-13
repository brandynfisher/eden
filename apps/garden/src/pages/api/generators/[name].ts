import { CONFIG } from '@/lib/config'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name } = req.query

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
    })
    const response = await eden.generators.get({
      generatorName: name as string,
    })
    return res.status(200).json({ generator: response.generator })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
