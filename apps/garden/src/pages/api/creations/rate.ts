import { getAuthToken } from '@/lib/auth'
import { handleAxiosServerError } from '@/lib/fetcher'
// import { CONFIG } from '@/lib/config'
// import { EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getAuthToken(req)
  // const { creationId, rating } = req.body

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    // const eden = new EdenClient({
    //   edenApiUrl: CONFIG.API_URL,
    //   token: authToken,
    // })
    // const response = await eden.creations.rate({
    //   creationId,
    //   rating,
    // })
    return res.status(200).json({ success: true })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return res.status(500).json({ message: errorMessage })
  }
}

export default handler
