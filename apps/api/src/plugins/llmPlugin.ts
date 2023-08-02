import type { FastifyInstance } from 'fastify'
import { Configuration, OpenAIApi } from 'openai'

export const complete = async (
  server: FastifyInstance,
  prompt: string,
): Promise<string> => {
  try {
    const completion = await server.llm.createCompletion({
      model: 'davinci',
      prompt,
      max_tokens: 300,
      temperature: 1.0,
      top_p: 1.0,
      stop: ['\n'],
    })
    if (!completion.data.choices) {
      throw new Error('No choices')
    }
    const choice = completion.data.choices[0]
    if (!choice.text) {
      throw new Error('No text')
    }
    return choice.text
  } catch (error) {
    server.log.error('Error during completion', error)
    throw error
  }
}

export const registerLlm = async (fastify: FastifyInstance) => {
  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    })
    const openai = new OpenAIApi(configuration)
    fastify.decorate('llm', openai)
    fastify.decorate('complete', complete)
    fastify.log.info('Successfully registered LlmPlugin')
  } catch (err) {
    console.error(err)
    fastify.log.error('Plugin: Llm, error on register', err)
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    llm: OpenAIApi
    complete: (server: FastifyInstance, prompt: string) => Promise<string>
  }
}

export default registerLlm
