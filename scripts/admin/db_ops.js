import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';

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

const changeStuff = async (db) => {
  const usersCollection = await db.collection('users');
  //const cursor = usersCollection.find({username: {$in: ["gene", "xander"]}});
  const cursor = usersCollection.find({isClerk: true});
  const users = await cursor.toArray();

  for (const user of users) {
    const userId = user.userId;
    await usersCollection.updateOne({ _id: user._id }, { $set: { username: userId } });
  }
};

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
  const creationsCollection = await db.collection('creations');
  const cursor = creationsCollection.find().sort({ createdAt: -1 }).allowDiskUse(true).batchSize(100);

  while (await cursor.hasNext()) {
    const creationsBatch = [];
    for (let i = 0; i < batchSize; i++) {
      const creation = await cursor.next();
      if(creation) {
        creationsBatch.push(creation);
      } else {
        break;
      }
    }

    await Promise.all(creationsBatch.map(async (creation) => {
      const creationId = creation._id;
    }));
  }
};

async function main() {
  const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    console.log(`Connected successfully to ${MONGO_URI}`);
    const db = await client.db(MONGO_DB_NAME);
    // await addToFeatureFlags(db);
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
