import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';
import { exec } from 'child_process';

const env = process.argv[2];
dotenv.config({ path: `../.env.${env}` });
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;
if (!MONGO_URI) {
  throw new Error('MONGO_URI environment variable is missing');
}
if (!MONGO_DB_NAME) {
  throw new Error('MONGO_DB_NAME environment variable is missing');
}

const addToFeatureFlags = async (db) => {
  const usernames = ["gene", "xander"]
  const usersCollection = await db.collection('users');
  const cursor = usersCollection.find({username: {$in: usernames.map(username => new RegExp(username, "i"))}});
  const users = await cursor.toArray();
  for (const user of users) {
    const userId = user.userId;
    //await usersCollection.updateOne({ _id: user._id }, { $set: { featureFlags: ["preview"] } });
  }
};

const iterateThroughCreations = async (db, db_backup) => {
  const batchSize = 1000;
  const creations = await db.collection('creations');

  const cursor = creations.find().sort({ createdAt: -1 }).limit(20).allowDiskUse(true).batchSize(batchSize);

  while (await cursor.hasNext()) {
    const docsBatch = [];
    for (let i = 0; i < batchSize; i++) {
      const doc = await cursor.next();
      if(doc) {
        docsBatch.push(doc);
      } else {
        break;
      }
    }
  
    await Promise.all(docsBatch.map(async (doc) => {
      // const uri = doc.uri;  
      
    }));
  }

};

const updateConceptAndGenerator = async (db, db_backup) => {
  const batchSize = 1000;
  const creations = await db.collection('creations');
  const tasks = await db.collection('tasks');

  const cursor = creations.find().sort({ createdAt: -1 }).limit(20).allowDiskUse(true).batchSize(batchSize);

  while (await cursor.hasNext()) {
    const docsBatch = [];
    for (let i = 0; i < batchSize; i++) {
      const doc = await cursor.next();
      if(doc) {
        docsBatch.push(doc);
      } else {
        break;
      }
    }
  
    await Promise.all(docsBatch.map(async (doc) => {
      const task = await tasks.findOne({_id: new ObjectId(doc.task)});
      const config = task.config;
      
      const generator = task.generator ? new ObjectId(task.generator) : null;
      const lora = config.lora ? new ObjectId(config.lora) : null;

      console.log(generator);
      console.log(lora);
      
      await creations.updateOne({ _id: doc._id }, { $set: { concept: lora, generator: generator } });

      }
    ));
  }
};

const resetTasks = async (db, db_backup) => {
  const tasks = await db.collection('tasks');
  const mannas = await db.collection('mannas');

  const twoHoursAgo = new Date(new Date().getTime() - 2 * 60 * 60 * 1000);

  const cursor = tasks.find({
    status: "running",
    createdAt: { $lt: twoHoursAgo }
  }).sort({ createdAt: -1 });

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (doc.output?.isFinal && doc.creation) {
      await tasks.updateOne({ _id: doc._id }, { $set: { status: "completed", progress: 1 } });
    }
    else {
      const manna = await mannas.findOne({user: doc.user})
      await mannas.updateOne({ _id: manna._id }, { $inc: { balance: doc.cost } });
      await tasks.updateOne({ _id: doc._id }, { $set: { status: "failed", error: "Task timed out" } });
    }
  }
}

async function main() {
  const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    console.log(`Connected successfully to ${MONGO_URI}`);
    const db = await client.db(MONGO_DB_NAME);
    // await resetTasks(db);
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
