import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error('MONGO_URI environment variable is missing');
}

async function updateMediaUploadTypes(db) {
  const createGenerator = await db.collection('generators').findOne({generatorName: "create"});
  createGenerator.versions.forEach(version => {
    const versionParametersWithMediaUpload = version.parameters.filter(parameter => parameter.name == "init_image_data");
    versionParametersWithMediaUpload.forEach(parameter => {
      parameter.mediaUpload = 'image/png, image/jpeg, image/webp';
    });
  });
  await db.collection('generators').updateOne(
    { generatorName: 'create' },
    { $set: { versions: createGenerator.versions } }
  );

  const remixGenerator = await db.collection('generators').findOne({generatorName: "remix"});
  remixGenerator.versions.forEach(version => {
    const versionParametersWithMediaUpload = version.parameters.filter(parameter => parameter.name == "init_image_data");
    versionParametersWithMediaUpload.forEach(parameter => {
      parameter.mediaUpload = 'image/png, image/jpeg, image/webp';
    });
  });
  await db.collection('generators').updateOne(
    { generatorName: 'remix' },
    { $set: { versions: remixGenerator.versions } }
  );

  const real2realGenerator = await db.collection('generators').findOne({generatorName: "real2real"});
  real2realGenerator.versions.forEach(version => {
    const versionParametersWithMediaUpload = version.parameters.filter(parameter => parameter.name == "interpolation_init_images");
    versionParametersWithMediaUpload.forEach(parameter => {
      parameter.mediaUpload = 'image/png, image/jpeg, image/webp';
    });
  });
  await db.collection('generators').updateOne(
    { generatorName: 'real2real' },
    { $set: { versions: real2realGenerator.versions } }
  );

  const wav2lipGenerator = await db.collection('generators').findOne({generatorName: "wav2lip"});
  wav2lipGenerator.versions.forEach(version => {
    const versionParametersWithMediaUpload = version.parameters.filter(parameter => parameter.name == "face_url");
    versionParametersWithMediaUpload.forEach(parameter => {
      parameter.mediaUpload = 'image/png, image/jpeg, image/webp';
    });
  });
  await db.collection('generators').updateOne(
    { generatorName: 'wav2lip' },
    { $set: { versions: wav2lipGenerator.versions } }
  );
  const wav2lipGenerator2 = await db.collection('generators').findOne({generatorName: "wav2lip"});
  wav2lipGenerator2.versions.forEach(version => {
    const versionParametersWithMediaUpload = version.parameters.filter(parameter => parameter.name == "speech_url");
    versionParametersWithMediaUpload.forEach(parameter => {
      parameter.mediaUpload = 'audio/webm, audio/mp3, audio/wav';
    });
  });
  await db.collection('generators').updateOne(
    { generatorName: 'wav2lip' },
    { $set: { versions: wav2lipGenerator2.versions } }
  );

  const ttsGenerator = await db.collection('generators').findOne({generatorName: "tts"});
  ttsGenerator.versions.forEach(version => {
    const versionParametersWithMediaUpload = version.parameters.filter(parameter => parameter.name == "voice_file_urls");
    versionParametersWithMediaUpload.forEach(parameter => {
      parameter.mediaUpload = 'audio/webm, audio/mp3, audio/wav';
    });
  });
  await db.collection('generators').updateOne(
    { generatorName: 'tts' },
    { $set: { versions: ttsGenerator.versions } }
  );

  const interrogateGenerator = await db.collection('generators').findOne({generatorName: "interrogate"});
  interrogateGenerator.versions.forEach(version => {
    const versionParametersWithMediaUpload = version.parameters.filter(parameter => parameter.name == "init_image_data");
    versionParametersWithMediaUpload.forEach(parameter => {
      parameter.mediaUpload = 'image/png, image/jpeg, image/webp';
    });
  });
  await db.collection('generators').updateOne(
    { generatorName: 'interrogate' },
    { $set: { versions: interrogateGenerator.versions } }
  );

  const conceptGenerator = await db.collection('generators').findOne({generatorName: "sdxl-lora-trainer"});
  conceptGenerator.versions.forEach(version => {
    const versionParametersWithMediaUpload = version.parameters.filter(parameter => parameter.name == "lora_training_urls");
    versionParametersWithMediaUpload.forEach(parameter => {
      parameter.mediaUpload = 'image/png, image/jpeg, image/webp, application/zip';
    });
  });
  await db.collection('generators').updateOne(
    { generatorName: 'sdxl-lora-trainer' },
    { $set: { versions: conceptGenerator.versions } }
  );

}

async function main() {
  const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log(`Connected successfully to ${MONGO_URI}`);
    const db = await client.db('eden');
    // await updateMediaUploadTypes(db);
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
