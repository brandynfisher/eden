import { CONFIG } from '@/lib/config'
import { withSessionRoute } from '@/lib/withSession'
import { EdenClient } from '@eden-labs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
    })
    const response = await eden.creations.list()
    return res.status(200).json({ creations: response.creations })
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withSessionRoute(handler)
