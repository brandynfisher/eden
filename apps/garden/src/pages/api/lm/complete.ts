import { CONFIG } from '@/lib/config'
import { NextApiRequest, NextApiResponse } from 'next'
import { Configuration, OpenAIApi } from 'openai'

export interface CompletionRequestBody {
  prompt: string
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    try {
      const { prompt } = req.body
      const configuration = new Configuration({
        apiKey: CONFIG.OPENAI_API_KEY,
      })
      const openai = new OpenAIApi(configuration)

      const response = await openai.createCompletion({
        model: 'davinci',
        prompt,
        max_tokens: 100,
        top_p: 1.0,
        stop: ['\n'],
      })
      const completion = response.data.choices[0].text

      res.status(200).json({ completion })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error })
    }
  }
}

export default handler
