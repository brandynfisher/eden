import { Concept } from '../../models/Concept'
import { GeneratorDocument } from '../../models/Generator'
import { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'

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
    newConfig.text_input = newConfig.interpolation_texts?.join(' to ') || ''
  }

  if (newConfig.init_image === '') {
    delete newConfig.init_image
  }

  if (newConfig.control_image === '') {
    delete newConfig.control_image
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
  newConfig.style_images
    ? (newConfig.style_images = newConfig.style_images.join('|'))
    : null
  newConfig.input_images
    ? (newConfig.input_images = newConfig.input_images.join('|'))
    : null
  newConfig.mask_images
    ? (newConfig.mask_images = newConfig.mask_images.join('|'))
    : null
  newConfig.text_inputs_to_interpolate
    ? (newConfig.text_inputs_to_interpolate = newConfig.text_inputs_to_interpolate.join('|'))
    : null
  newConfig.text_inputs_to_interpolate_weights
    ? (newConfig.text_inputs_to_interpolate_weights = newConfig.text_inputs_to_interpolate_weights.join('|'))
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
  const preparedConfig = await formatConfigForReplicate(config)
  preparedConfig.mode = generator.generatorName
  console.log('preparedConfig', preparedConfig)
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
}

const getTransactionCost = (
  _: FastifyInstance,
  generator: any,
  generatorVersion: any,
  config: any,
) => {
  if (generator.output === 'concept') {
    return 75
  }

  const baseCost = Math.round(config.n_frames * 0.75) || 1
  const samples = config.n_samples || 1
  const cost = baseCost * samples
  return cost
}

export { submitTask, getTransactionCost }
