import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

export type CreationUpdatePartial = {
  isPrivate: boolean
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getAuthToken(req)
  const { id } = req.query

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      token: authToken,
    })

    if (req.method === 'GET') {
      return getSession(id as string, req, res, eden)
    }

    return res.status(501).json({ error: `HTTP ${req.method} not implemented` })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return res.status(500).json({ message: errorMessage })
  }
}

const getSession = async (
  id: string,
  _req: NextApiRequest,
  res: NextApiResponse,
  eden: EdenClient,
) => {
  const response = await eden.sessions.get({
    sessionId: id,
  })
  return res.status(200).json({ session: response.session })
}

export default handler
