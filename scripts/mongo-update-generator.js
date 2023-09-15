import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

import createParameters from './generators/create.js';
import interpolateParameters from './generators/interpolate.js';
import real2realParameters from './generators/real2real.js';
import remixParameters from './generators/remix.js';
import interrogateParameters from './generators/interrogate.js';
import wav2lipParameters from './generators/wav2lip.js';
import conceptParameters from './generators/concept.js';
import blendParameters from './generators/blend.js';
import upscaleParameters from './generators/upscale.js';
import monologueParameters from './generators/monologue.js';
import zeroscopeParameters from './generators/zeroscope-v2-xl.js';

const allowedCogs = [
  "eden-sd-pipelines-sdxl",
  "character",
  "sdxl-lora-trainer",
  "zeroscope-v2-xl",
  "task-runner",
]

const env = process.argv[2];
dotenv.config({ path: `./.env.${env}` });
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;
if (!MONGO_URI) {
  throw new Error('MONGO_URI environment variable is missing');
}
if (!MONGO_DB_NAME) {
  throw new Error('MONGO_DB_NAME environment variable is missing');
}

const cog = process.argv[3];
if (!cog) {
  throw new Error('cog argument is missing');
}
if (cog && !allowedCogs.includes(cog)) {
  throw new Error(`cog argument is invalid. Only ${allowedCogs.join(', ')} are allowed`);
}

const versionId = process.argv[4];
if (!versionId) {
  throw new Error('versionId argument is missing');
}

console.log(`Adding ${versionId} to ${cog} generators`);

async function updateVersion(db) {

  if (cog === 'eden-sd-pipelines-sdxl') {

    const createGeneratorVersion = {
      provider: 'replicate',
      address: 'abraham-ai/eden-sd-pipelines-sdxl',
      versionId: versionId,
      mode: 'generate',
      parameters: createParameters,
      isDeprecated: false,
    }

    const interpolateGeneratorVersion = {
      provider: 'replicate',
      address: 'abraham-ai/eden-sd-pipelines-sdxl',
      versionId: versionId,
      mode: 'interpolate',
      parameters: interpolateParameters,
      isDeprecated: false,
    }

    const real2realGeneratorVersion = {
      provider: 'replicate',
      address: 'abraham-ai/eden-sd-pipelines-sdxl',
      versionId: versionId,
      mode: 'real2real',
      parameters: real2realParameters,
      isDeprecated: false
    }

    const remixGeneratorVersion = {
      provider: 'replicate',
      address: 'abraham-ai/eden-sd-pipelines-sdxl',
      versionId: versionId,
      mode: 'remix',
      parameters: remixParameters,
      isDeprecated: false
    }

    const interrogateGeneratorVersion = {
      provider: 'replicate',
      address: 'abraham-ai/eden-sd-pipelines-sdxl',
      versionId: versionId,
      mode: 'interrogate',
      parameters: interrogateParameters,
      isDeprecated: false
    }

    const blendGeneratorVersion = {
      provider: 'replicate',
      address: 'abraham-ai/eden-sd-pipelines-sdxl',
      versionId: versionId,
      mode: 'blend',
      parameters: blendParameters,
      isDeprecated: false
    }

    const upscaleGeneratorVersion = {
      provider: 'replicate',
      address: 'abraham-ai/eden-sd-pipelines-sdxl',
      versionId: versionId,
      mode: 'upscale',
      parameters: upscaleParameters,
      isDeprecated: false
    }

    await db.collection('generators').updateOne(
      { generatorName: 'create' }, 
      { $addToSet: { versions: createGeneratorVersion } }
    );

    await db.collection('generators').updateOne(
      { generatorName: 'interpolate' }, 
      { $addToSet: { versions: interpolateGeneratorVersion } }
    );

    await db.collection('generators').updateOne(
      { generatorName: 'remix' }, 
      { $addToSet: { versions: remixGeneratorVersion } }
    );

    await db.collection('generators').updateOne(
      { generatorName: 'real2real' }, 
      { $addToSet: { versions: real2realGeneratorVersion } }
    );

    await db.collection('generators').updateOne(
      { generatorName: 'interrogate' }, 
      { $addToSet: { versions: interrogateGeneratorVersion } }
    );

    await db.collection('generators').updateOne(
      { generatorName: 'blend' }, 
      { $addToSet: { versions: blendGeneratorVersion } }
    );

    await db.collection('generators').updateOne(
      { generatorName: 'upscale' }, 
      { $addToSet: { versions: upscaleGeneratorVersion } }
    );

  }

  else if (cog === 'character') {

    const wav2lipGeneratorVersion = {
      provider: 'replicate',
      address: 'abraham-ai/character',
      versionId: versionId,
      mode: 'wav2lip',
      parameters: wav2lipParameters,
      isDeprecated: false
    }

    await db.collection('generators').updateOne(
      { generatorName: 'wav2lip' }, 
      { $addToSet: { versions: wav2lipGeneratorVersion } }
    );
  
  }
  
  else if (cog === 'sdxl-lora-trainer') {

    const conceptGeneratorVersion = {
      provider: 'replicate',
      address: 'abraham-ai/sdxl-lora-trainer',
      versionId: versionId,
      mode: 'concept',
      parameters: conceptParameters,
      isDeprecated: false
    }

    await db.collection('generators').updateOne(
      { generatorName: 'sdxl-lora-trainer' }, 
      { $addToSet: { versions: conceptGeneratorVersion } }
    );

  }

  else if (cog === 'zeroscope-v2-xl') {

    const zeroscopeVersion = {
      provider: 'replicate',
      address: 'anotherjesse/zeroscope-v2-xl',
      versionId: versionId,
      mode: 'zeroscope',
      parameters: zeroscopeParameters,
      isDeprecated: false
    }

    await db.collection('generators').updateOne(
      { generatorName: 'zeroscope-v2-xl' }, 
      { $addToSet: { versions: zeroscopeVersion } }
    );

  }

  else if (cog === 'task-runner') {

    const monologueVersion = {
      provider: 'task-runner',
      address: 'eden/monologue',
      versionId: versionId,
      mode: 'monologue',
      parameters: monologueParameters,
      isDeprecated: false
    }

    await db.collection('generators').updateOne(
      { generatorName: 'monologue' }, 
      { $addToSet: { versions: monologueVersion } }
    );

  }

  console.log(`Added ${versionId} to ${cog} generators`);
}


async function main() {
  const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log(`Connected successfully to ${MONGO_URI}`);
    const db = await client.db(MONGO_DB_NAME);
    await updateVersion(db);
  } catch (err) {
    console.error('Failed to connect to the server:', err);
    throw err;
  } finally {
    client.close();
  }
}

main().catch(err => {
  console.error('An unhandled error occurred:', err);
  process.exit(1);
});
