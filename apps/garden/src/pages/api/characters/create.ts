import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { handleAxiosServerError } from '@/lib/fetcher'
import { Capabilites, EdenClient } from '@edenlabs/eden-sdk'
import { CharactersCreateArguments } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getAuthToken(req)

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const { name, voice, image, greeting, dialogue, logosData, isPrivate } =
    req.body as CharactersCreateArguments

  if (logosData?.concept === '') {
    logosData.concept = undefined
  }

  logosData.capabilities = [Capabilites.CHAT]

  // TODO: make more dynamic
  if (logosData?.knowledge) {
    const extraCapabilities = [Capabilites.CREATION, Capabilites.KNOWLEDGE]
    logosData.capabilities = [...logosData.capabilities, ...extraCapabilities]
  }

  try {
    const eden = new EdenClient({
      edenApiUrl: CONFIG.API_URL,
      token: authToken,
    })
    const response = await eden.characters.create({
      name,
      image,
      voice,
      greeting,
      dialogue,
      logosData,
      isPrivate,
    })
    return res.status(200).json({ characterId: response.characterId })
  } catch (error) {
    const errorMessage = handleAxiosServerError(error)
    console.error(errorMessage)
    return res.status(500).json({ message: errorMessage })
  }
}

export default handler
