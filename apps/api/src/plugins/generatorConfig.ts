import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

const dummyConfig: GeneratorV2[] = [
  {
    key: 'txt2img',
    name: 'Text to Image',
    description: 'Colorful description of what this thing does',
    outputType: 'image',
    hidden: false,
    parameters: [
      {
        name: 'prompt',
        label: 'Text Prompt',
        type: 'text',
      },
    ],
  },
  {
    key: 'inpaint',
    name: 'In-painting',
    description: 'Colorful description of what this thing does',
    outputType: 'image',
    hidden: false,
    parameters: [
      {
        name: 'prompt',
        label: 'Text Prompt',
        type: 'text',
      },
      {
        name: 'starting_image',
        label: 'Starting Image',
        type: 'image',
      },
      {
        name: 'mask',
        label: 'Mask Image',
        type: 'image',
      },
    ],
  },
  {
    key: 'xhibit/vton',
    name: 'xhibit/vton',
    description: 'Colorful description of what this thing does',
    hidden: true,
    outputType: 'image',
    parameters: [
      {
        name: 'prompt',
        label: 'Text Prompt',
        type: 'text',
      },
      {
        name: 'look_image',
        label: 'Look Image',
        type: 'image',
      },
      {
        name: 'lora',
        label: 'Lora',
        type: 'model',
      },
    ],
  },
]

// TODO: Implement actual GET request towards modal API app
const fetchConfigs = async (
  _fastify: FastifyInstance,
): Promise<GeneratorV2[]> => {
  // return fastify.generatorConfigs ? [dummyConfigB] : [dummyConfigA]
  return dummyConfig
}

const REFRESH_INTERVAL_MS = 10 * 60 * 1000

const registerGeneratorConfigs: FastifyPluginAsync = async fastify => {
  try {
    fastify.decorate('generatorConfigs', await fetchConfigs(fastify))

    const refreshHandler = async () => {
      console.log('Fetching new generator configs...')
      const newConfigs = await fetchConfigs(fastify)

      if (!newConfigs) {
        fastify.log.error(
          'Plugin: GeneratorConfigs, new configs response is empty!',
        )
        return
      }

      fastify.generatorConfigs = newConfigs
      console.log(
        'New generator configs received:',
        JSON.stringify(fastify.generatorConfigs, null, 2),
      )
    }

    const intervalId = setInterval(refreshHandler, REFRESH_INTERVAL_MS)

    fastify.addHook('onClose', (_instance, done) => {
      clearInterval(intervalId)
      done()
    })

    fastify.log.info('Successfully registered plugin: GeneratorConfigs')
  } catch (err) {
    fastify.log.error('Plugin: GeneratorConfigs, error on register', err)
  }
}

export default registerGeneratorConfigs

declare module 'fastify' {
  interface FastifyInstance {
    generatorConfigs: GeneratorV2[]
  }
}
