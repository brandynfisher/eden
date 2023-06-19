import { CONFIG } from '@/lib/config'
import { withSessionRoute } from '@/lib/withSession'
import { EdenClient } from '@eden-labs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { creatorId } = req.query as { creatorId: string }

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      token: req.session.token,
    })
    const response = await eden.creators.get({
      userId: creatorId,
    })
    return res.status(200).json({ creator: response.creator })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withSessionRoute(handler)
