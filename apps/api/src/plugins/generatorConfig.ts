import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

const dummyConfig: GeneratorV2[] = [
  {
    name: 'txt2img',
    title: 'Text to Image',
    outputType: 'image',
    parameters: [
      {
        name: 'prompt',
        label: 'Text Prompt',
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

const REFRESH_INTERVAL_MS = 5 * 60 * 1000

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
