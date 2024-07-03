import { CONFIG } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
    })
    const response = await eden.creations.list()
    return res.status(200).json({ creations: response.docs })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return res.status(500).json({ message: errorMessage })
  }
}

export default handler
