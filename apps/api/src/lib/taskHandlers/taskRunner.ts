import { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'
import { ChatCompletionRequestMessage } from 'openai'

import { Character } from '../../models/Character'
import { uploadBufferAsset } from '../../plugins/minioPlugin'
import { randomId } from '../util'
import { receiveTaskUpdate } from './edenHandlers'

const submitTask = async (
  server: FastifyInstance,
  generatorVersion: any,
  config: any,
) => {
  const task = { id: randomId(24) }
  setTimeout(async () => {
    await runTask(server, task, generatorVersion, config)
  }, 0)
  return task
}

const runTask = async (
  server: FastifyInstance,
  task: any,
  generatorVersion: any,
  config: any,
) => {
  console.log(
    `Running task ${task.id} for generator ${
      generatorVersion.versionId
    } with config ${JSON.stringify(config)}`,
  )

  const { llm, elevenLabs, replicate } = server
  if (!llm) {
    throw new Error('Llm not initialized')
  }
  if (!elevenLabs) {
    throw new Error('Elevenlabs not initialized')
  }
  if (!replicate) {
    throw new Error('Replicate not initialized')
  }

  const character = await Character.findOne({
    _id: new ObjectId(config.characterId),
  })

  if (!character) {
    throw new Error('Character not found')
  }

  const systemMessage = `You are playing ${character.name}. ${character.description}. You are to respond to users in character, as if you were ${character.name}.`

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

  const completion = await server.llm.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: messages,
    temperature: 1,
    max_tokens: 512,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  })

  if (!completion.data.choices) {
    throw new Error('No choices')
  }
  const response = completion.data.choices[0].message?.content
  if (!response) {
    throw new Error('No response from character')
  }

  const voiceId = character.voice || 'EXAVITQu4vr4xnSDxMaL'

  const audioBuffer = await elevenLabs.runTask(voiceId, response)
  const { uri: audioUri } = await uploadBufferAsset(server, audioBuffer)

  const faceUrl = character.image

  const generatorAddress = 'abraham-ai/character'
  const model = await replicate.models.get(generatorAddress)

  const result = await model.predict({
    mode: 'wav2lip',
    face_url: faceUrl?.replace(
      'http://localhost:9000',
      'https://354a-145-224-73-37.ngrok-free.app',
    ),
    speech_url: audioUri.replace(
      'http://localhost:9000',
      'https://354a-145-224-73-37.ngrok-free.app',
    ),
    gfpgan: false,
    gfpgan_upscale: 1,
    intro_text: null,
  })

  console.log('finished!')
  console.log(result)

  const update = {
    id: task.id,
    status: 'succeeded',
    progress: 1,
    output: result[0],
    error: null,
  }

  await receiveTaskUpdate(server, update)
}

const getTransactionCost = (
  _: FastifyInstance,
  generatorVersion: any,
  config: any,
) => {
  const cost = 5
  return cost
}

export { submitTask, getTransactionCost }
