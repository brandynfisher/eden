import { CONFIG } from '@/lib/config'
import { withSessionRoute } from '@/lib/withSession'
import { EdenClient } from '@edenlabs/eden-sdk'
import { CharactersCreateArguments } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = req.session.token
  const { name, voice, image, description, greeting, dialogue } =
    req.body as CharactersCreateArguments

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
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
      description,
      greeting,
      dialogue,
    })
    return res.status(200).json({ characterId: response.characterId })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withSessionRoute(handler)
