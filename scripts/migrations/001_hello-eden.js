import createParameters from '../generators/create.js'
import interpolationParameters from '../generators/interpolate.js'
import real2realParameters from '../generators/real2real.js'
import remixParameters from '../generators/remix.js'

const main = async (db, ADMIN_API_KEY, ADMIN_API_SECRET) => {
  console.log('Adding generator versions...')

  const provider = 'replicate'
  const address = 'abraham-ai/eden-sd-pipelines'
  const versionId =
    '79befe687d0930473e5528b59673890c694250b615e8405bc8f245f906ae8042'

  // Define new versions
  const createGeneratorVersion = {
    provider,
    address,
    versionId,
    mode: 'generate',
    parameters: createParameters,
    isDeprecated: false,
  }

  const interpolateGeneratorVersion = {
    provider,
    address,
    versionId,
    mode: 'interpolate',
    parameters: interpolationParameters,
    isDeprecated: false,
  }

  const real2realGeneratorVersion = {
    provider,
    address,
    versionId,
    mode: 'real2real',
    parameters: real2realParameters,
    isDeprecated: false,
  }

  const remixGeneratorVersion = {
    provider,
    address,
    versionId,
    mode: 'remix',
    parameters: remixParameters,
    isDeprecated: false,
  }

  // Fetch and update each generator with new version
  const generatorNames = ['create', 'interpolate', 'real2real', 'remix']
  const newVersions = [
    createGeneratorVersion,
    interpolateGeneratorVersion,
    real2realGeneratorVersion,
    remixGeneratorVersion,
  ]

  for (let i = 0; i < generatorNames.length; i++) {
    const generator = await db
      .collection('generators')
      .findOne({ generatorName: generatorNames[i] })
    if (generator) {
      generator.versions.push(newVersions[i])
      await db
        .collection('generators')
        .updateOne(
          { generatorName: generatorNames[i] },
          { $set: { versions: generator.versions } },
        )
    } else {
      console.log(`Generator "${generatorNames[i]}" not found in the database.`)
    }
  }

  console.log('Creating a secure admin API Key...')
  const user = await db.collection('users').findOne({ userId: 'admin' })
  if (user) {
    await db.collection('apikeys').insertOne({
      user: user._id,
      apiKey: ADMIN_API_KEY,
      apiSecret: ADMIN_API_SECRET,
      createdAt: new Date(),
      updatedAt: new Date(),
      note: 'Production admin API key, created by migration.',
    })
  } else {
    console.log(`User "admin" not found in the database.`)
  }
}

export default main
