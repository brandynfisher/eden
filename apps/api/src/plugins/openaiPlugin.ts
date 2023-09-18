import type { FastifyInstance } from 'fastify'
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai'

export const complete = async (
  server: FastifyInstance,
  prompt: string,
): Promise<string> => {
  try {
    const completion = await server.openai.createCompletion({
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

export const chatComplete = async (
  server: FastifyInstance,
  chat: ChatCompletionRequestMessage[],
): Promise<string> => {
  try {
    const completion = await server.openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: chat,
      temperature: 1,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })
    if (!completion.data.choices) {
      throw new Error('No choices')
    }
    const choice = completion.data.choices[0]
    if (!choice.message?.content) {
      throw new Error('No text')
    }
    return choice.message.content
  } catch (error) {
    server.log.error('Error during completion', error)
    throw error
  }
}

export const registerOpenai = async (fastify: FastifyInstance) => {
  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    })
    const openai = new OpenAIApi(configuration)
    fastify.decorate('openai', openai)
    fastify.decorate('complete', complete)
    fastify.decorate('chatComplete', chatComplete)
    fastify.log.info('Successfully registered OpenaiPlugin')
  } catch (err) {
    console.error(err)
    fastify.log.error('Plugin: Openai, error on register', err)
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    openai: OpenAIApi
    complete: (server: FastifyInstance, prompt: string) => Promise<string>
    chatComplete: (server: FastifyInstance, prompt: string) => Promise<string>
  }
}

export default registerOpenai
