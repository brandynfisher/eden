import { CONFIG } from '@/lib/config'
import { withSessionRoute } from '@/lib/withSession'
import { EdenClient } from '@eden-labs/eden-sdk'
import { AgentsCreateArguments } from '@eden-labs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = req.session.token
  const { name, capabilities } = req.body as AgentsCreateArguments

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      token: authToken,
    })
    const response = await eden.agents.create({ name, capabilities })
    return res.status(200).json({ agentId: response.agentId })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withSessionRoute(handler)
