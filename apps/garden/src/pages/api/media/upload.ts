import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getAuthToken(req)

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const { filename, contentType } = req.body as {
      filename: string
      contentType: string
    }

    const response = await axios.post(
      `${CONFIG.API_URL}/media/upload/request`,
      {
        filename,
        contentType,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    const { signedUrl } = response.data
    res.status(200).json({ signedUrl })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return res.status(500).json({ message: errorMessage })
  }
}

export default handler
