import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { withSessionRoute } from '@/lib/withSession'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getAuthToken(req)
  const { userId } = req.body

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      token: authToken,
    })
    await eden.creators.follow({
      userId,
    })
    return res.status(200).json({ follow: userId })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withSessionRoute(handler)
