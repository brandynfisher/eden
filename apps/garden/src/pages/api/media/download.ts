import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getAuthToken(req)

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const { url } = req.query

    const response = await axios.get(
      `${CONFIG.API_URL}/media/download?url=${url}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    const { signedUrl } = response.data
    res.status(200).json({ signedUrl })
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
