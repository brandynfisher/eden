import { CONFIG } from '@/lib/config'
import { withSessionRoute } from '@/lib/withSession'
import {
  CharactersCreateArguments,
  CharactersUpdateArguments,
  EdenClient,
} from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

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
      return getCharacter(id as string, req, res, eden)
    }

    if (req.method === 'POST') {
      const {
        name,
        image,
        voice,
        capabilities,
        description,
        greeting,
        dialogue,
        isPrivate,
      } = req.body as CharactersCreateArguments

      const item = {
        name,
        image,
        voice,
        capabilities,
        description,
        greeting,
        dialogue,
        isPrivate,
      }

      return createCharacter(item, req, res, eden)
    }

    if (req.method === 'PATCH') {
      const {
        characterId,
        name,
        image,
        voice,
        capabilities,
        description,
        greeting,
        dialogue,
        isPrivate,
      } = req.body as CharactersUpdateArguments

      const update = {
        characterId,
        name,
        image,
        voice,
        capabilities,
        description,
        greeting,
        dialogue,
        isPrivate,
      }

      return updateCharacter(update, req, res, eden)
    }

    if (req.method === 'DELETE') {
      return deleteCharacter(id as string, req, res, eden)
    }

    return res.status(501).json({ error: `HTTP ${req.method} not implemented` })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

const createCharacter = async (
  item: CharactersCreateArguments,
  req: NextApiRequest,
  res: NextApiResponse,
  eden: EdenClient,
) => {
  const response = await eden.characters.create(item)
  return res.status(200).json({ characterId: response.characterId })
}

const getCharacter = async (
  id: string,
  req: NextApiRequest,
  res: NextApiResponse,
  eden: EdenClient,
) => {
  const response = await eden.characters.get({ slug: id })
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

export default withSessionRoute(handler)
