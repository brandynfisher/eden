import { FastifyInstance } from 'fastify'

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

  const completion = await llm.createCompletion({
    model: 'text-davinci-003',
    prompt: config.prompt,
    temperature: 0.9,
    max_tokens: 200,
    top_p: 1,
    frequency_penalty: 0.15,
    presence_penalty: 0.1,
  })

  const answer = completion.data.choices[0].text

  if (!answer) {
    throw new Error('No result')
  }

  const audioBuffer = await elevenLabs.runTask('EXAVITQu4vr4xnSDxMaL', answer)

  const { uri: audioUri } = await uploadBufferAsset(server, audioBuffer)

  console.log('SAVE', audioUri)

  const faceUrl =
    'https://minio.aws.abraham.fun/creations-stg/6f93def26cc577b6a3bb7152da5bb3dbebb5eebf293f100712bd115635294bda.jpg'
  const speech_url = audioUri

  console.log('face_url', faceUrl)
  console.log('speech_url', speech_url)

  const generatorAddress = 'abraham-ai/character'
  // const model = await replicate.getModel(generatorAddress)
  const model = await replicate.models.get(generatorAddress)

  console.log(model)

  const result = await model.predict({
    mode: 'wav2lip',
    face_url: faceUrl,
    speech_url: audioUri,
    gfpgan: false,
    gfpgan_upscale: 1,
    intro_text: null,
  })

  console.log('finished!')
  console.log(result)

  const output = {
    result,
    isFinal: true,
  }

  const update = {
    id: task.id,
    status: 'processing',
    progress: 1,
    output,
    error: null,
  }

  await receiveTaskUpdate(server, update)
}

const getTransactionCost = (
  _: FastifyInstance,
  generatorVersion: any,
  config: any,
) => {
  const cost = 20
  return cost
}

export { submitTask, getTransactionCost }
