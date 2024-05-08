import { handleAxiosServerError } from '@/lib/fetcher'
import axios from 'axios'
import { getAuthToken } from '@/lib/auth'
import { NextApiRequest, NextApiResponse } from 'next'
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getAuthToken(req)

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_EDEN_API_URL}/media/upload/sign-request`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    )

    res.status(200).json(response.data)
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return res.status(500).json({ message: errorMessage })
  }
}

export default handler

