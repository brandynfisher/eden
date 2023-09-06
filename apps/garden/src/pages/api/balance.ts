import { CONFIG } from '@/lib/config'
import { getSessionCookie } from '@/lib/fetcher'
import axios from 'axios'
import { randomUUID } from 'crypto'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getSessionCookie(req)

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    // const eden = new EdenClient({
    //   edenApiUrl: CONFIG.API_URL,
    //   token: authToken,
    // })
    // const response = await eden.manna.balance()
    const response = await axios.post(`${CONFIG.API_URL}/manna/balance`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Request-Key': randomUUID(),
      },
      data: {
        token: authToken,
      },
    })
    return res.status(200).json({ manna: response.data.manna })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
