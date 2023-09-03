import { FastifyInstance } from 'fastify'

import { Concept } from '../../models/Concept'
import { User } from '../../models/Creator'

const makeWebhookUrl = (server: FastifyInstance) =>
  `${server.config.WEBHOOK_URL}/tasks/update?secret=${server.config.WEBHOOK_SECRET}`

export const formatStableDiffusionConfigForReplicate = async (config: any) => {
  const newConfig = { ...config }

  // if no text input, use interpolation texts
  if (!newConfig.text_input) {
    newConfig.text_input =
      newConfig.interpolation_texts?.join(' to ') || 'Untitled'
  }

  // convert lists into |-separated strings
  newConfig.interpolation_texts
    ? (newConfig.interpolation_texts = newConfig.interpolation_texts.join('|'))
    : null
  newConfig.interpolation_seeds
    ? (newConfig.interpolation_seeds = newConfig.interpolation_seeds.join('|'))
    : null
  newConfig.interpolation_init_images
    ? (newConfig.interpolation_init_images =
        newConfig.interpolation_init_images.join('|'))
    : null
  newConfig.voice_file_urls
    ? (newConfig.voice_file_urls = newConfig.voice_file_urls.join('|'))
    : null
  newConfig.lora_training_urls
    ? (newConfig.lora_training_urls = newConfig.lora_training_urls.join('|'))
    : null
  newConfig.latent_blending_skip_f
    ? (newConfig.latent_blending_skip_f =
        newConfig.latent_blending_skip_f.join('|'))
    : null

  // if it's a Concept training
  if (newConfig.lora_training_urls) {
    // remove any spaces, pipes, or underscores in the name
    newConfig.name = newConfig.name.replace(/ /g, '')
    newConfig.name = newConfig.name.replace(/\|/g, '')
    newConfig.name = newConfig.name.replace(/_/g, '')
  }

  // if no lora selected, delete it
  if (newConfig.lora == '(none)') {
    delete newConfig.lora
  }

  return newConfig
}

const submitTask = async (
  server: FastifyInstance,
  generatorVersion: any,
  config: any,
) => {
  const { replicate } = server
  if (!replicate) {
    throw new Error('Replicate not initialized')
  }
  const webhookUrl = makeWebhookUrl(server)

  const generatorAddress = generatorVersion.address
  const model = await replicate.getModel(generatorAddress)
  if (!model.results) {
    throw new Error(`Could not find model ${generatorAddress}`)
  }
  const modelId = generatorVersion.versionId
  try {
    const preparedConfig = await formatStableDiffusionConfigForReplicate(config)
    preparedConfig.mode = generatorVersion.mode
    // @ts-ignore
    const task = await replicate.startPrediction(
      modelId,
      preparedConfig,
      webhookUrl,
      ['start', 'output', 'completed'],
    )
    if (task.status == 422) {
      throw new Error(task.detail)
    }
    return task
  } catch (error) {
    throw new Error(`${error}`)
  }
}

const getTransactionCost = (_: FastifyInstance, __: any, config: any) => {
  const baseCost = config.n_frames || 1
  const samples = config.n_samples || 1
  const cost = baseCost * samples
  return cost
}

export { submitTask, getTransactionCost }
