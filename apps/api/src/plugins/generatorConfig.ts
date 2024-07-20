import { GeneratorV2 } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

export type GeneratorConfig = {
  configs: GeneratorV2[]
  list: Partial<GeneratorV2[]>
}

const fetchConfigs = async (
  server: FastifyInstance,
): Promise<GeneratorConfig> => {
  console.log('fetchConfigs', `${server.config.EDEN_COMPUTE_API_URL}/tools`)
  const modalResponse = await axios.get(
    `${server.config.EDEN_COMPUTE_API_URL}/tools`,
    {
      headers: {
        Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
      },
    },
  )

  const configs = Array.from(modalResponse.data as GeneratorV2[])
  const list = Array.from(modalResponse.data as GeneratorV2[]).map(config => {
    return {
      ...config,
      parameters: undefined,
    }
  })

  return {
    configs,
    list,
  }
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
        // JSON.stringify(fastify.generatorConfigs.configs, null, 2),
        fastify.generatorConfigs.configs.length,
      )
    }

    const intervalId = setInterval(refreshHandler, REFRESH_INTERVAL_MS)

    fastify.addHook('onClose', (_instance, done) => {
      console.log('fastify::onClose')
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
    generatorConfigs: GeneratorConfig
  }
}
