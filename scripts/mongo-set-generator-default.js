import dotenv from 'dotenv';

import { MongoClient, ObjectId } from "mongodb";

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

console.log(``);
console.log(`Setting ${versionId} as default to ${cog} generators`);
console.log(``);

function handleUpdateResult(res, cog, generatorName, versionId) {
  if (!res) {
    console.error(`  ERROR: Query failed!`, cog, generatorName, versionId)
    return
  }

  if (res.matchedCount < 1) {
    console.error(`  ERROR: No generator with this version found!`, cog, generatorName, versionId);
    return;
  }

  if (res.modifiedCount < 1) {
    console.error(`  WARNING: Generator defaultVersionId was not modified!`, cog, generatorName, versionId);
    return;
  }


  console.log('  SUCCESS - UPDATED defaultVersionId', cog, generatorName, versionId)
}

async function updateDefaultVersion(db) {
  console.log(` `);
  console.log(`Updating...`);
  console.log(` `);

  const sdxl_generators = [
    'create', 'remix', 'blend', 
    'interrogate', 'controlnet',
  ];
  const sdxl_generators_video = [
    'interpolate', 'real2real'
  ];
  const scenario_runner_generators = [
    'monologue', 'dialogue',
  ];
  const comfyui_generators = [
    'txt2vid', 'img2vid', 'makeitrad', 'vid2vid', 'upscale',
  ];

  if (cog === 'eden-sd-pipelines-sdxl') {
    for (const generatorName of sdxl_generators) {
      handleUpdateResult(
        await db.collection('generators').updateOne(
          { generatorName: generatorName, 'versions.versionId': versionId },
          { $set: { defaultVersionId: versionId } }
        ),
        cog,
        generatorName,
        versionId
      )
    }
  }
  else if (cog === 'eden-sd-pipelines-sdxl-video') {
    for (const generatorName of sdxl_generators_video) {
      handleUpdateResult(
        await db.collection('generators').updateOne(
          { generatorName: generatorName, 'versions.versionId': versionId },
          { $set: { defaultVersionId: versionId } }
        ),
        cog,
        generatorName,
        versionId
      )
    }
  }
  else if (cog === 'character') {
    handleUpdateResult(
      await db.collection('generators').updateOne(
        { generatorName: 'wav2lip', 'versions.versionId': versionId },
        { $set: { defaultVersionId: versionId } }
      ),
      cog,
      'wav2lip',
      versionId
    )
  }
  else if (cog === 'scenarioRunner') {
    for (const generatorName of scenario_runner_generators) {
      handleUpdateResult(
        await db.collection('generators').updateOne(
          { generatorName: generatorName, 'versions.versionId': versionId },
          { $set: { defaultVersionId: versionId } }
        ),
        cog,
        generatorName,
        versionId
      )
    }
  }
  else if (cog === 'eden-comfyui') {
    for (const generatorName of comfyui_generators) {
      handleUpdateResult(
        await db.collection('generators').updateOne(
          { generatorName: generatorName, 'versions.versionId': versionId },
          { $set: { defaultVersionId: versionId } }
        ),
        cog,
        generatorName,
        versionId
      )
    }
  }
  else if (cog === 'sdxl-lora-trainer') {
    handleUpdateResult(
      await db.collection('generators').updateOne(
        { generatorName: 'sdxl-lora-trainer', 'versions.versionId': versionId },
        { $set: { defaultVersionId: versionId } }
      ),
      cog,
      'sdxl-lora-trainer',
      versionId
    )
  }
  else if (cog === 'zeroscope-v2-xl') {
    handleUpdateResult(
      await db.collection('generators').updateOne(
        { generatorName: 'zeroscope-v2-xl', 'versions.versionId': new ObjectId(versionId) },
        { $set: { defaultVersionId: versionId } }
      ),
      cog,
      'zeroscope-v2-xl',
      versionId
    )
  }

  console.log(' ');
  console.log('Done. See script output for results.');
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
