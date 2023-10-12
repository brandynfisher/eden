import type { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'
import { ChatCompletionRequestMessage } from 'openai'

import { Character, CharacterDocument } from '../models/Character'

interface ChatMessage {
  character: CharacterDocument
  message: string
}

export const monologue = async (
  server: FastifyInstance,
  config: any,
): Promise<ChatMessage> => {
  try {
    const { openai } = server

    const character = await Character.findOne({
      _id: new ObjectId(config.characterId),
    })
    if (!character) {
      throw new Error('Character not found')
    }

    const systemMessage = `You are a world class improvisational actor playing a character named ${character.name}. Here is a description of you.
    
    ${character.description}

    You will be prompted by users to make up monologues about various topics. When prompted, stay in character, do not break the fourth wall, or write any explanations. Just respond and answer like ${character.name} would.`

    const messages: ChatCompletionRequestMessage[] = [
      {
        role: 'system',
        content: systemMessage,
      },
      {
        role: 'user',
        content: config.prompt,
      },
    ]

    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: messages,
      temperature: 1,
      max_tokens: 512,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    const response = completion.data.choices[0].message?.content
    if (!response) {
      throw new Error('No response from character')
    }

    const message: ChatMessage = {
      character: character,
      message: response,
    }

    return message
  } catch (error) {
    server.log.error('Error during monologue', error)
    throw error
  }
}

export const dialogue = async (
  server: FastifyInstance,
  config: any,
): Promise<ChatMessage[]> => {
  const { openai } = server

  try {
    const character1 = await Character.findOne({
      _id: new ObjectId(config.characterIds[0]),
    })
    const character2 = await Character.findOne({
      _id: new ObjectId(config.characterIds[1]),
    })
    if (!character1 || !character2) {
      throw new Error('Character not found')
    }

    const characters = [character1, character2]
    const messages: ChatMessage[] = []

    for (let m = 0; m < 8; m++) {
      const active = characters[m % characters.length]
      const other = characters[(m + 1) % characters.length]

      const systemMessage: ChatCompletionRequestMessage = {
        role: 'system',
        content: `You are a world class improvisational actor playing a character named ${
          active.name
        }. Here is a description of you.
        
        ${active.description}

        You are having a conversation with ${
          other.name
        }. Here is a description of ${other.name}:

        ${other.description}

        The subject of this conversation is this: ${config.prompt}

        In the conversation, try not to make too many soliloquies or long statements. This is a conversation. Sometimes just let the other person lead, ask supporting questions, some of your lines can be just a few words long. Only when when you see a need for it, take lead of the conversation. Do not constantly say each other's names. Make it feel realistic.

        Remember: *You* are ${
          active.name
        }. Stay in character, do not break the fourth wall, or write any explanations. Just respond and answer like ${
          active.name
        } would.
        
        ${
          m === 0 &&
          'You are beginning the conversation. What is the first thing you say? Just the line. No quotes, no name markers.'
        }`,
      }

      const chatMessages: ChatCompletionRequestMessage[] = messages.map(
        m =>
          ({
            role: m.character === active._id ? 'assistant' : 'user',
            content: m.message,
          } as ChatCompletionRequestMessage),
      )

      const allMessages: ChatCompletionRequestMessage[] = [
        systemMessage,
        ...chatMessages,
      ]

      const completion = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: allMessages,
        temperature: 1,
        max_tokens: 512,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      })

      const response = completion.data.choices[0].message?.content
      if (!response) {
        throw new Error('No response from character')
      }
      messages.push({
        character: active,
        message: response,
      })
    }
    return messages
  } catch (error) {
    server.log.error('Error during dialogue', error)
    throw error
  }
}

interface Logos {
  monologue: (server: FastifyInstance, prompt: string) => Promise<ChatMessage>
  dialogue: (server: FastifyInstance, prompt: string) => Promise<ChatMessage[]>
}

const logos: Logos = {
  monologue: monologue,
  dialogue: dialogue,
}

export const registerLogos = async (fastify: FastifyInstance) => {
  try {
    fastify.decorate('logos', logos)
    fastify.log.info('Successfully registered LogosPlugin')
  } catch (err) {
    console.error(err)
    fastify.log.error('Plugin: Logos, error on register', err)
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    logos: Logos
  }
}

export default registerLogos
