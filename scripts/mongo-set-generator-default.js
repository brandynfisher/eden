import dotenv from 'dotenv';

import { MongoClient } from 'mongodb';

const allowedCogs = [
  "eden-sd-pipelines-sdxl",
  "eden-sd-pipelines-sdxl-video",
  "character",
  "sdxl-lora-trainer",
  "zeroscope-v2-xl",
  "scenarioRunner",
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
  throw new Error(`cog argument is invalid. Only ${allowed_cogs.join(', ')} are allowed`);
}

const versionId = process.argv[4];
if (!versionId) {
  throw new Error('versionId argument is missing');
}

console.log(`Setting ${versionId} as default to ${cog} generators`);

async function updateDefaultVersion(db) {

  const sdxl_generators = [
    'create', 'remix', 
    'blend', 'upscale',
    'interrogate', 'controlnet',
  ];
  const sdxl_generators_video = [
    'interpolate', 'real2real', 
  ];
  const scenario_runner_generators = [
    'monologue', 'dialogue',
  ];    
  if (cog === 'eden-sd-pipelines-sdxl') {
    for (const generatorName of sdxl_generators) {
      await db.collection('generators').updateOne(
        { generatorName: generatorName }, 
        { $set: { defaultVersionId: versionId } }      
      );  
    }
  }
  else if (cog === 'eden-sd-pipelines-sdxl-video') {
    for (const generatorName of sdxl_generators_video) {
      await db.collection('generators').updateOne(
        { generatorName: generatorName }, 
        { $set: { defaultVersionId: versionId } }      
      );  
    }
  }
  else if (cog === 'character') {
    await db.collection('generators').updateOne(
      { generatorName: 'wav2lip' }, 
      { $set: { defaultVersionId: versionId } }
    );
  }
  else if (cog === 'scenarioRunner') {
    for (const generatorName of scenario_runner_generators) {
      await db.collection('generators').updateOne(
        { generatorName: generatorName }, 
        { $set: { defaultVersionId: versionId } }      
      );  
    }
  }
  else if (cog === 'sdxl-lora-trainer') {
    await db.collection('generators').updateOne(
      { generatorName: 'sdxl-lora-trainer' }, 
      { $set: { defaultVersionId: versionId } }
    );
  }
  else if (cog === 'zeroscope-v2-xl') {
    await db.collection('generators').updateOne(
      { generatorName: 'zeroscope-v2-xl' }, 
      { $set: { defaultVersionId: versionId } }
    );
  }
  console.log(`Setting default ${versionId} to ${cog} generators`);
}

async function main() {
  const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log(`Connected successfully to ${MONGO_URI}`);
    const db = await client.db(MONGO_DB_NAME);
    await updateDefaultVersion(db);
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
