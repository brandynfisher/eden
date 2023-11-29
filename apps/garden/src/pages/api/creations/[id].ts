import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { EdenClient } from '@edenlabs/eden-sdk'
import axios, { AxiosError } from 'axios'
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
      return getCreation(id as string, req, res, eden)
    }

    if (!authToken) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (req.method === 'PATCH') {
      const { update } = req.body
      return updateCreation(
        id as string,
        update as CreationUpdatePartial,
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
  updatePartial: CreationUpdatePartial,
  req: NextApiRequest,
  res: NextApiResponse,
  eden: EdenClient,
) => {
  try {
    const response = await eden.creations.update({
      creationId: id,
      ...updatePartial,
    })
    return res.status(200).json({ creation: response.creation })
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const axiosError = e.toJSON() as AxiosError
      return res
        .status(axiosError.status || 500)
        .json({ message: 'Item is flagged as NSFW. Can not make public' })
    }
    return res.status(500).json({ error: e })
  }
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

export default handler
