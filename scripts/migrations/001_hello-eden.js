import createParameters from '../generators/create.js'
import interpolationParameters from '../generators/interpolate.js'
import real2realParameters from '../generators/real2real.js'
import remixParameters from '../generators/remix.js'

const main = async db => {
  console.log('Adding generators...')

  const provider = 'replicate'
  const address = 'abraham-ai/eden-sd-pipelines'
  const versionId =
    '79befe687d0930473e5528b59673890c694250b615e8405bc8f245f906ae8042'

  // Register generators
  const createGeneratorVersion = {
    provider,
    address,
    versionId,
    mode: 'generate',
    parameters: createParameters,
    isDeprecated: false,
  }

  const createGenerator = {
    generatorName: 'create',
    description: 'Create an image from a prompt',
    output: 'creation',
    versions: [createGeneratorVersion],
  }

  const interpolateGeneratorVersion = {
    provider,
    address,
    versionId,
    mode: 'interpolate',
    parameters: interpolationParameters,
    isDeprecated: false,
  }

  const interpolateGenerator = {
    generatorName: 'interpolate',
    description: 'Create a video interpolation between two prompts',
    output: 'creation',
    versions: [interpolateGeneratorVersion],
  }

  const real2realGeneratorVersion = {
    provider,
    address,
    versionId,
    mode: 'real2real',
    parameters: real2realParameters,
    isDeprecated: false,
  }

  const real2realGenerator = {
    generatorName: 'real2real',
    description: 'Create a video interpolation between two images',
    output: 'creation',
    versions: [real2realGeneratorVersion],
  }

  const remixGeneratorVersion = {
    provider,
    address,
    versionId,
    mode: 'remix',
    parameters: remixParameters,
    isDeprecated: false,
  }

  const remixGenerator = {
    generatorName: 'remix',
    description: 'Generate a remix of an image',
    output: 'creation',
    versions: [remixGeneratorVersion],
  }

  await db.createCollection('generators')

  await db
    .collection('generators')
    .insertMany([
      createGenerator,
      interpolateGenerator,
      real2realGenerator,
      remixGenerator,
    ])
}

export default main
