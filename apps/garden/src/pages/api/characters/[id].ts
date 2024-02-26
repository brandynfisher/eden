import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
import { CharactersUpdateArguments, EdenClient } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getAuthToken(req)
  const { id } = req.query

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      token: authToken,
    })

    if (req.method === 'GET') {
      return getCharacter(id as string, req, res, eden)
    }

    if (!authToken) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (req.method === 'PATCH') {
      const { name, image, voice, greeting, dialogue, logosData, isPrivate } =
        req.body as CharactersUpdateArguments

      if (!id) {
        return res.status(500).json({ error: 'No characterId provided' })
      }

      const update = {
        characterId: String(id),
        name,
        image,
        voice,
        greeting,
        dialogue,
        logosData,
        isPrivate,
      }

      return updateCharacter(update, req, res, eden)
    }

    if (req.method === 'DELETE') {
      return deleteCharacter(id as string, req, res, eden)
    }

    return res.status(501).json({ error: `HTTP ${req.method} not implemented` })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return res.status(500).json({ message: errorMessage })
  }
}

const getCharacter = async (
  id: string,
  req: NextApiRequest,
  res: NextApiResponse,
  eden: EdenClient,
) => {
  const response = await eden.characters.get({ characterId: id })
  return res.status(200).json({ character: response.character })
}

const updateCharacter = async (
  updatePartial: CharactersUpdateArguments,
  req: NextApiRequest,
  res: NextApiResponse,
  eden: EdenClient,
) => {
  const response = await eden.characters.update(updatePartial)
  return res.status(200).json({ character: response.character })
}

const deleteCharacter = async (
  id: string,
  req: NextApiRequest,
  res: NextApiResponse,
  eden: EdenClient,
) => {
  await eden.characters.delete({
    characterId: id,
  })
  return res.status(200).json({ success: true })
}

export default handler
