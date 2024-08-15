import { GeneratorV2 } from '@edenlabs/eden-sdk'
import axios from 'axios'
import axiosRetry from 'axios-retry'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

export type GeneratorConfig = {
  configs: GeneratorV2[]
  list: Partial<GeneratorV2[]>
}

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
})

const brokenGeneratorsToOmit = [
  'layer_diffusion',
  'reel',
  'story',
  'img2vid_museV',
  'stable_audio',
]

const fetchConfigs = async (
  server: FastifyInstance,
): Promise<GeneratorConfig> => {
  const computeApiUrl = `${server.config.EDEN_COMPUTE_API_URL}/tools`

  server.log.info(`fetchConfigs: ${computeApiUrl}`)

  const modalResponse = await axios.get(computeApiUrl, {
    'axios-retry': {
      retries: Infinity,
      retryDelay: axiosRetry.exponentialDelay,
      onRetry: (retryCount, _error, _requestConfig) => {
        // server.log.warn({error, requestConfig})
        server.log.warn(
          `Re-trying (${retryCount}) - fetchConfigs: ${computeApiUrl}`,
        )
      },
    },
    headers: {
      Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
    },
  })

  const filteredGenerators = Array.from(
    modalResponse.data as GeneratorV2[],
  ).filter(generator => !brokenGeneratorsToOmit.includes(generator.key))
  const configs = Array.from(filteredGenerators)
  const list = Array.from(filteredGenerators).map(config => {
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
      fastify.log.info('Fetching new generator configs...')

      try {
        const newConfigs = await fetchConfigs(fastify)

        if (!newConfigs) {
          fastify.log.error(
            'Plugin: GeneratorConfigs, new configs response is empty!',
          )
          return
        }

        fastify.generatorConfigs = newConfigs

        fastify.log.info(
          'New generator configs received:',
          // JSON.stringify(fastify.generatorConfigs.configs, null, 2),
          fastify.generatorConfigs.configs.length,
        )
      } catch (e) {
        fastify.log.error(
          `Failed to refresh generator configs, keep stale data`,
        )
      }
    }

    const intervalId = setInterval(refreshHandler, REFRESH_INTERVAL_MS)

    fastify.addHook('onClose', (_instance, done) => {
      fastify.log.info('fastify::onClose')
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
