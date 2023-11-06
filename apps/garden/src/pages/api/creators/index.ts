import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log('getting creator')
  const authToken = await getAuthToken(req)
  console.log('got token')
  const { creatorId } = req.query as { creatorId: string }
  console.log('the creator id', creatorId)

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      token: authToken,
    })
    console.log('made eden client')
    const response = await eden.creators.get({
      userId: creatorId,
    })
    console.log('got response')
    return res.status(200).json({ creator: response.creator })
  } catch (error) {
    console.error(error)
    return res.status(500).json(error || { error: 'Internal server error' })
  }
}

export default handler
