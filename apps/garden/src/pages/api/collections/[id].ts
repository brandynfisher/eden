import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
import { EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

export type CollectionUpdatePartial = {
  isPrivate?: boolean
  deleted?: boolean
  name?: string
  description?: string
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
      return getCollection(id as string, req, res, eden)
    }

    if (!authToken) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (req.method === 'PATCH') {
      const { update } = req.body
      console.log({ id, update })
      return updateCollection(
        id as string,
        update as CollectionUpdatePartial,
        req,
        res,
        eden,
      )
    }

    if (req.method === 'DELETE') {
      return deleteCollection(id as string, req, res, eden)
    }

    return res.status(501).json({ error: `HTTP ${req.method} not implemented` })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return res.status(500).json({ message: errorMessage })
  }
}

const getCollection = async (
  id: string,
  req: NextApiRequest,
  res: NextApiResponse,
  eden: EdenClient,
) => {
  const response = await eden.collections.get({
    collectionId: id,
  })
  return res.status(200).json({ collection: response.collection })
}

const updateCollection = async (
  id: string,
  updatePartial: CollectionUpdatePartial,
  req: NextApiRequest,
  res: NextApiResponse,
  eden: EdenClient,
) => {
  try {
    console.log(id, updatePartial)
    const response = await eden.collections.update({
      collectionId: id,
      ...updatePartial,
    })
    return res.status(200).json({ collection: response.collection })
  } catch (e) {
    return res.status(500).json({ error: e })
  }
}

const deleteCollection = async (
  id: string,
  req: NextApiRequest,
  res: NextApiResponse,
  eden: EdenClient,
) => {
  await eden.collections.delete({
    collectionId: id,
  })
  return res.status(200).json({ success: true })
}

export default handler
