import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
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
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return res.status(500).json({ message: errorMessage })
  }
}

const getCreation = async (
  id: string,
  req: NextApiRequest,
  res: NextApiResponse,
  eden: EdenClient,
) => {
  await eden.creations.get({
    creationId: id,
  }).then((response) => {
    if (!response || response.message) {
      return res.status(500).json({ message: response.message || 'Internal Error - unknown' })
    }

    if (!response.creation) {
      return res.status(404).json({ message: response.message || `Creation ${id} not found` })
    }

    return res.status(200).json({ creation: response.creation })
  })
  .catch((error) => {
    return res.status(error.response.status || 500).json({
      message: error?.response?.data?.message || error.response.statusText || 'Internal Exception',
      error: process.env.NEXT_PUBLIC_APP_ENV === 'production' ? '- redacted -' : error,
    })
  })
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
