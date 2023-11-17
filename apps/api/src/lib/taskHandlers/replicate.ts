import { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'

import { Concept } from '../../models/Concept'
import { GeneratorDocument } from '../../models/Generator'

const makeWebhookUrl = (server: FastifyInstance) =>
  `${server.config.WEBHOOK_URL}/tasks/update?secret=${server.config.WEBHOOK_SECRET}`

const formatConfigForReplicate = async (config: any) => {
  const newConfig = { ...config }

  // if it's a Concept training, remove any spaces, pipes, or underscores in the name
  if (newConfig.lora_training_urls) {
    newConfig.name = newConfig.name.replace(/ /g, '')
    newConfig.name = newConfig.name.replace(/\|/g, '')
    newConfig.name = newConfig.name.replace(/_/g, '')
  }

  // if no lora selected, delete it
  if (newConfig.lora) {
    const concept = await Concept.findOne({ _id: new ObjectId(newConfig.lora) })
    newConfig.lora = concept?.uri
  } else {
    delete newConfig.lora
  }

  // if no text input, use interpolation texts
  if (!newConfig.text_input) {
    newConfig.text_input =
      newConfig.interpolation_texts && newConfig.interpolation_texts.length
        ? newConfig.interpolation_texts
            ?.filter((text: string) => !!text.trim())
            .join('|')
        : null
  }

  // convert lists into |-separated strings
  newConfig.interpolation_texts && newConfig.interpolation_texts.length
    ? (newConfig.interpolation_texts = newConfig.interpolation_texts
        .filter((text: string) => !!text.trim())
        .join('|'))
    : null
  newConfig.interpolation_seeds && newConfig.interpolation_seeds.length
    ? (newConfig.interpolation_seeds = newConfig.interpolation_seeds
        .filter((text: string) => !!text.trim())
        .join('|'))
    : null
  newConfig.interpolation_init_images &&
  newConfig.interpolation_init_images.length
    ? (newConfig.interpolation_init_images = newConfig.interpolation_init_images
        .filter((text: string) => !!text.trim())
        .join('|'))
    : null
  newConfig.voice_file_urls && newConfig.voice_file_urls.length
    ? (newConfig.voice_file_urls = newConfig.voice_file_urls
        .filter((text: string) => !!text.trim())
        .join('|'))
    : null
  newConfig.lora_training_urls && newConfig.lora_training_urls.length
    ? (newConfig.lora_training_urls = newConfig.lora_training_urls
        .filter((text: string) => !!text.trim())
        .join('|'))
    : null
  newConfig.latent_blending_skip_f && newConfig.latent_blending_skip_f.length
    ? (newConfig.latent_blending_skip_f = newConfig.latent_blending_skip_f
        .filter((text: string) => !!text.trim())
        .join('|'))
    : null

  return newConfig
}

const submitTask = async (
  server: FastifyInstance,
  generator: GeneratorDocument,
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
    const preparedConfig = await formatConfigForReplicate(config)
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

const getTransactionCost = (
  _: FastifyInstance,
  generator: any,
  generatorVersion: any,
  config: any,
) => {
  if (generatorVersion.mode === 'concept') {
    return 100
  }

  const baseCost = config.n_frames || 1
  const samples = config.n_samples || 1
  const cost = baseCost * samples
  return cost
}

export { submitTask, getTransactionCost }
