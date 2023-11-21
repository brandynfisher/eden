import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import axios from 'axios'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req

  switch (method) {
    case 'GET':
      try {
        const basePath = `${CONFIG.API_URL}/auth/discord/disconnect`
        const response = await axios.get(basePath, {
          headers: await getAuthHeaders(req),
        })
        return res.status(200).json(response.data)
      } catch (_error) {
        console.error(_error)
        res.status(401).json({ error: 'Error Disconnecting Discord' })
      }
      break
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}

export default handler
