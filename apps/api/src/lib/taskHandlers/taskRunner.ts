import { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'
import { ChatCompletionRequestMessage } from 'openai'

import { Character } from '../../models/Character'
import { uploadBufferAsset } from '../../plugins/minioPlugin'
import { randomId } from '../util'
import { receiveTaskUpdate } from './edenHandlers'

const submitTask = async (
  server: FastifyInstance,
  generator: any,
  generatorVersion: any,
  config: any,
) => {
  const task = { id: randomId(24) }
  setTimeout(async () => {
    await runTask(server, task, generator, generatorVersion, config)
  }, 0)
  return task
}

const runTask = async (
  server: FastifyInstance,
  task: any,
  generator: any,
  generatorVersion: any,
  config: any,
) => {
  console.log('run task 1')
  console.log(
    `Running task ${task.id} for generator ${
      generatorVersion.versionId
    } with config ${JSON.stringify(config)}`,
  )

  console.log('HELOO!!')
  console.log(generator)

  console.log('run task 2')
  const { openai, elevenLabs, replicate } = server
  if (!openai) {
    console.log('Openai not init')
    throw new Error('Openai not initialized')
  }
  if (!elevenLabs) {
    console.log('eleven not init')
    throw new Error('Elevenlabs not initialized')
  }
  if (!replicate) {
    console.log('rep not init')
    throw new Error('Replicate not initialized')
  }

  if (generator.generatorName == 'monologue') {
    console.log('run task 3')
    const character = await Character.findOne({
      _id: new ObjectId(config.characterId),
    })
    console.log('run task 4')
    console.log(character)

    if (!character) {
      throw new Error('Character not found')
    }
    console.log('run task 5')
    const systemMessage = `You are playing ${character.name}. ${character.description}. You are to respond to users in character, as if you were ${character.name}.`

    console.log('run task 6')
    console.log(systemMessage)
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

    console.log('run task 6.5')

    const completion = await server.openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 1,
      max_tokens: 512,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    console.log('run task 7')

    if (!completion.data.choices) {
      console.log('no choices')
      throw new Error('No choices')
    }
    const response = completion.data.choices[0].message?.content
    if (!response) {
      console.log('no response')
      throw new Error('No response from character')
    }

    console.log('voice')
    const voiceId = character.voice || 'EXAVITQu4vr4xnSDxMaL'
    console.log(voiceId)

    const audioBuffer = await elevenLabs.runTask(voiceId, response)
    const { uri: audioUri } = await uploadBufferAsset(server, audioBuffer)

    console.log('run task 8')
    console.log(audioUri)
    const faceUrl = character.image

    const generatorAddress = 'abraham-ai/character'
    const model = await replicate.models.get(generatorAddress)
    console.log(generatorAddress)
    console.log('run task 9')

    console.log('THE MODEL')
    console.log(model)
    console.log(faceUrl)
    console.log(audioUri)

    const result = await model.predict({
      mode: 'wav2lip',
      face_url: faceUrl,
      speech_url: audioUri,
      gfpgan: false,
      gfpgan_upscale: 1,
      intro_text: null,
    })
    console.log('run task 10')

    console.log('finished!')
    console.log(result)

    const update = {
      id: task.id,
      status: 'succeeded',
      progress: 1,
      output: result[0],
      error: null,
    }

    console.log('update')
    console.log(update)

    await receiveTaskUpdate(server, update)
  } else if (generator.generatorName == 'dialogue') {
    console.log('THIS IS A DIALOGUEEUEUEUEUEUEU!!!')

    console.log('run task 3')
    const character1 = await Character.findOne({
      _id: new ObjectId(config.characterIds[0]),
    })
    const character2 = await Character.findOne({
      _id: new ObjectId(config.characterIds[0]),
    })
    console.log('run task 4')
    console.log(character1)
    console.log(character2)

    if (!character1 || !character2) {
      throw new Error('Character not found')
    }

    console.log('run task 5')
    const systemMessage = `You are playing ${character1.name}. ${character1.description}. You are to respond to users in character, as if you were ${character1.name}.`

    console.log('run task 6')
    console.log(systemMessage)
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

    console.log('run task 6.5')

    const completion = await server.openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 1,
      max_tokens: 512,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    console.log('run task 7')

    if (!completion.data.choices) {
      console.log('no choices')
      throw new Error('No choices')
    }
    const response = completion.data.choices[0].message?.content
    if (!response) {
      console.log('no response')
      throw new Error('No response from character')
    }

    console.log('voice')
    const voiceId = character1.voice || 'EXAVITQu4vr4xnSDxMaL'
    console.log(voiceId)

    const audioBuffer = await elevenLabs.runTask(voiceId, response)
    const { uri: audioUri } = await uploadBufferAsset(server, audioBuffer)

    console.log('run task 8')
    console.log(audioUri)
    const faceUrl = character1.image

    const generatorAddress = 'abraham-ai/character'
    const model = await replicate.models.get(generatorAddress)
    console.log(generatorAddress)
    console.log('run task 9')
    const result = await model.predict({
      mode: 'wav2lip',
      face_url: faceUrl,
      speech_url: audioUri,
      gfpgan: false,
      gfpgan_upscale: 1,
      intro_text: null,
    })
    console.log('run task 10')

    console.log('finished!')
    console.log(result)

    const update = {
      id: task.id,
      status: 'succeeded',
      progress: 1,
      output: result[0],
      error: null,
    }

    console.log('update')
    console.log(update)

    await receiveTaskUpdate(server, update)
  }
}

const getTransactionCost = (
  _: FastifyInstance,
  generator: any,
  generatorVersion: any,
  config: any,
) => {
  const cost = 5
  return cost
}

export { submitTask, getTransactionCost }
