import { CONFIG } from '@/lib/config'
import { withSessionRoute } from '@/lib/withSession'
import { Creation, EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = req.session.token
  const { id } = req.query

  console.log(id, req.query)

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      token: authToken,
    })

    if (req.method === 'GET') {
      return getCreation(id as string, req, res, eden)
    }

    if (req.method === 'PATCH') {
      const { update } = req.body
      return updateCreation(
        id as string,
        update as Partial<Creation>,
        req,
        res,
        eden,
      )
    }

    if (req.method === 'DELETE') {
      return deleteCreation(id as string, req, res, eden)
    }

    return res.status(501).json({ error: `HTTP ${req.method} not implemented` })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

const getCreation = async (
  id: string,
  req: NextApiRequest,
  res: NextApiResponse,
  eden: EdenClient,
) => {
  const response = await eden.creations.get({
    creationId: id,
  })
  return res.status(200).json({ creation: response.creation })
}

const updateCreation = async (
  id: string,
  updatePartial: Partial<Creation>,
  req: NextApiRequest,
  res: NextApiResponse,
  eden: EdenClient,
) => {
  const response = await eden.creations.update({
    creationId: id,
    update: updatePartial,
  })
  return res.status(200).json({ creation: response.creation })
}

const deleteCreation = async (
  id: string,
  req: NextApiRequest,
  res: NextApiResponse,
  eden: EdenClient,
) => {
  await eden.creations.delete({
    creationId: id,
  })
  return res.status(200).json({ success: true })
}

export default withSessionRoute(handler)
