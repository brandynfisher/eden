import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getAuthToken(req)
  const { address, message, signature } = req.body

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    await axios.post(
      CONFIG.API_URL + '/auth/migrate',
      {
        address,
        message,
        signature,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    )
    return res.status(200).json({})
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
