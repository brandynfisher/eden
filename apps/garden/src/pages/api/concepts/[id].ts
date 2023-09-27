import { CONFIG } from '@/lib/config'
import { withSessionRoute } from '@/lib/withSession'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

export type ConceptUpdatePartial = {
  isPrivate: boolean
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = req.session.token
  const { id } = req.query

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      token: authToken,
    })

    if (req.method === 'GET') {
      return getConcept(id as string, req, res, eden)
    }

    if (req.method === 'PATCH') {
      const { update } = req.body
      return updateConcept(
        id as string,
        update as ConceptUpdatePartial,
        req,
        res,
        eden,
      )
    }

    if (req.method === 'DELETE') {
      return deleteConcept(id as string, req, res, eden)
    }

    return res.status(501).json({ error: `HTTP ${req.method} not implemented` })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

const getConcept = async (
  id: string,
  req: NextApiRequest,
  res: NextApiResponse,
  eden: EdenClient,
) => {
  const response = await eden.concepts.get({
    conceptId: id,
  })
  return res.status(200).json({ concept: response.concept })
}

const updateConcept = async (
  id: string,
  updatePartial: ConceptUpdatePartial,
  req: NextApiRequest,
  res: NextApiResponse,
  eden: EdenClient,
) => {
  const response = await eden.concepts.update({
    conceptId: id,
    ...updatePartial,
  })
  return res.status(200).json({ concept: response.concept })
}

const deleteConcept = async (
  id: string,
  req: NextApiRequest,
  res: NextApiResponse,
  eden: EdenClient,
) => {
  await eden.concepts.delete({
    conceptId: id,
  })
  return res.status(200).json({ success: true })
}

export default withSessionRoute(handler)
