import path from 'path';
import { fileURLToPath } from 'url';
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
import controlnetParameters from './generators/controlnet.js';
import monologueParameters from './generators/monologue.js';
import dialogueParameters from './generators/dialogue.js';
import zeroscopeParameters from './generators/zeroscope-v2-xl.js';

//import comfyuiParameters from './generators/comfyui.js';
//import animatediffParameters from './generators/animatediff.js';
import comfyuiTxt2VidParameters from './generators/comfy_txt2vid.js';
import comfyuiImg2VidParameters from './generators/comfy_img2vid.js';
import comfyuiVid2VidParameters from './generators/comfy_vid2vid.js';
import comfyuiUpscaleParameters from './generators/comfy_upscale.js';
import comfyuiMakeitradParameters from './generators/comfy_makeitrad.js';

 
const allowedCogs = [
  "eden-sd-pipelines-sdxl",
  "eden-sd-pipelines-sdxl-video",
  "character",
  "sdxl-lora-trainer",
  "zeroscope-v2-xl",
  "scenarioRunner",
  "eden-comfyui"
]

const env = process.argv[2];
dotenv.config({ path: `./.env.${env}` });
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;

console.log("-------------------------------");
console.log(process.env.MONGO_URI);
console.log("-------------------------------");


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

    const controlnetGeneratorVersion = {
      provider: 'replicate',
      address: 'abraham-ai/eden-sd-pipelines-sdxl',
      versionId: versionId,
      mode: 'controlnet',
      parameters: controlnetParameters,
      isDeprecated: false
    }

    await db.collection('generators').updateOne(
      { generatorName: 'create' }, 
      { $addToSet: { versions: createGeneratorVersion } }
    );

    await db.collection('generators').updateOne(
      { generatorName: 'remix' }, 
      { $addToSet: { versions: remixGeneratorVersion } }
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

    await db.collection('generators').updateOne(
      { generatorName: 'controlnet' }, 
      { $addToSet: { versions: controlnetGeneratorVersion } }
    );

  }

  else if (cog === 'eden-sd-pipelines-sdxl-video') {

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

    await db.collection('generators').updateOne(
      { generatorName: 'interpolate' }, 
      { $addToSet: { versions: interpolateGeneratorVersion } }
    );

    await db.collection('generators').updateOne(
      { generatorName: 'real2real' }, 
      { $addToSet: { versions: real2realGeneratorVersion } }
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

  else if (cog === 'eden-comfyui') {

    const comfyuiTxt2VidVersion = {
      provider: 'replicate',
      address: 'abraham-ai/eden-comfyui',
      versionId: versionId,
      mode: 'comfy_txt2vid',
      parameters: comfyuiTxt2VidParameters,
      isDeprecated: false
    }

    const comfyuiImg2VidVersion = {
      provider: 'replicate',
      address: 'abraham-ai/eden-comfyui',
      versionId: versionId,
      mode: 'comfy_img2vid',
      parameters: comfyuiImg2VidParameters,
      isDeprecated: false
    }

    const comfyuiVid2VidVersion = {
      provider: 'replicate',
      address: 'abraham-ai/eden-comfyui',
      versionId: versionId,
      mode: 'comfy_vid2vid',
      parameters: comfyuiVid2VidParameters,
      isDeprecated: false
    }

    const comfyuiUpscaleVersion = {
      provider: 'replicate',
      address: 'abraham-ai/eden-comfyui',
      versionId: versionId,
      mode: 'comfy_upscale',
      parameters: comfyuiUpscaleParameters,
      isDeprecated: false
    }

    const comfyuiMakeitradVersion = {
      provider: 'replicate',
      address: 'abraham-ai/eden-comfyui',
      versionId: versionId,
      mode: 'comfy_makeitrad',
      parameters: comfyuiMakeitradParameters,
      isDeprecated: false
    }

    await db.collection('generators').updateOne(
      { generatorName: 'comfy_txt2vid' }, 
      { $addToSet: { versions: comfyuiTxt2VidVersion } }
    );

    await db.collection('generators').updateOne(
      { generatorName: 'comfy_img2vid' }, 
      { $addToSet: { versions: comfyuiImg2VidVersion } }
    );

    await db.collection('generators').updateOne(
      { generatorName: 'comfy_vid2vid' }, 
      { $addToSet: { versions: comfyuiVid2VidVersion } }
    );

    await db.collection('generators').updateOne(
      { generatorName: 'comfy_upscale' }, 
      { $addToSet: { versions: comfyuiUpscaleVersion } }
    );

    await db.collection('generators').updateOne(
      { generatorName: 'comfy_makeitrad' }, 
      { $addToSet: { versions: comfyuiMakeitradVersion } }
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

  else if (cog === 'scenarioRunner') {

    const monologueVersion = {
      provider: 'scenarioRunner',
      address: 'eden/monologue',
      versionId: versionId,
      mode: 'monologue',
      parameters: monologueParameters,
      isDeprecated: false
    }

    const dialogueVersion = {
      provider: 'scenarioRunner',
      address: 'eden/dialogue',
      versionId: versionId,
      mode: 'dialogue',
      parameters: dialogueParameters,
      isDeprecated: false
    }

    await db.collection('generators').updateOne(
      { generatorName: 'monologue' }, 
      { $addToSet: { versions: monologueVersion } }
    );

    await db.collection('generators').updateOne(
      { generatorName: 'dialogue' }, 
      { $addToSet: { versions: dialogueVersion } }
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
