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

function toCSV(data, filename) {
  const header = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(',')).join('\n');
  const csvContent = `${header}\n${rows}`;
  fs.writeFileSync(filename, csvContent);
  console.log('CSV file created: '+filename);
}

async function uniqueUsersMakingCreations(db, startTime, endTime) {
  const excludeUser = await db.collection('users').findOne({ _id: new ObjectId("63ec6691161b1ea82ac2284e") });
  const results = await db.collection('creations').aggregate([
    { $match: { createdAt: { $gte: startTime, $lte: endTime }, user: { $ne: excludeUser && excludeUser._id } } },
    { $group: { _id: "$user", creationsCount: { $sum: 1 } } },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userInfo" } },
    { $unwind: "$userInfo" },
    { $sort: { creationsCount: -1 } },
  ]).toArray();
  const usersWithCreations = results.map(result => ({
    userId: result.userInfo.userId,
    username: result.userInfo.username,
    creationsCount: result.creationsCount,
  }));
  return usersWithCreations;
}

async function creationsMadeOverTime(db, startTime, endTime, grouping) {
  const groupByDay = { 
    _id: { 
      $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
    }, 
    count: { $sum: 1 } 
  };
  const groupByWeek = { 
    _id: { 
      $concat: [
        { $toString: { $isoWeekYear: "$createdAt" } }, "-W", 
        { $toString: { $isoWeek: "$createdAt" } }
      ] 
    }, count: { $sum: 1 } 
  };
  const groupByMonth = { 
    _id: { 
      $dateToString: { format: "%Y-%m", date: "$createdAt" } 
    }, 
    count: { $sum: 1 } 
  };
  const excludeUser =  await db.collection('users').findOne({ _id: new ObjectId("63ec6691161b1ea82ac2284e") });
  const groupBy = grouping === 'week' ? groupByWeek : grouping === 'month' ? groupByMonth : groupByDay;
  const results = await db.collection('creations').aggregate([
    { $match: { createdAt: { $gte: startTime, $lte: endTime }, user: { $ne: new ObjectId(excludeUser && excludeUser._id) } } },
    { $group: groupBy },
    { $sort: { _id: 1 } },
  ]).toArray();
  return results;
}

async function totalUniqueUsersOverTime(db, startTime, endTime, grouping) {
  const groupByDay = {
    _id: {
      user: "$user",
      date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
    }
  };
  const groupByWeek = {
    _id: {
      user: "$user",
      date: {
        $concat: [
          { $toString: { $isoWeekYear: "$createdAt" } },
          "-W",
          { $toString: { $isoWeek: "$createdAt" } }
        ]
      }
    }
  };
  const groupByMonth = {
    _id: {
      user: "$user",
      date: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
    }
  };

  const excludeUser = await db.collection('users').findOne({ _id: new ObjectId("63ec6691161b1ea82ac2284e") });
  const groupBy = grouping === 'week' ? groupByWeek : grouping === 'month' ? groupByMonth : groupByDay;

  const results = await db.collection('creations').aggregate([
    { $match: { createdAt: { $gte: startTime, $lte: endTime }, user: { $ne: new ObjectId(excludeUser && excludeUser._id) } } },
    { $group: groupBy },
    { $group: { _id: "$_id.date", uniqueUsersCount: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]).toArray();

  return results;
}

async function stats(db) {
  const startTime = new Date('2021-08-17T00:00:00.000Z');
  const endTime = new Date('2023-10-01T00:00:00.000Z');
  const data_monthly = await creationsMadeOverTime(db, startTime, endTime, "month");
  //toCSV(data_monthly, 'creations_monthly.csv');
  // const data_monthly = await totalUniqueUsersOverTime(db, startTime, endTime, "month");
  // todo -- loop through weeks
  //const userCreationCounts = await uniqueUsersMakingCreations(db, startTime, endTime);
  console.log(data_monthly);
}

async function main() {
  const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    console.log(`Connected successfully to ${MONGO_URI}`);
    const db = await client.db(MONGO_DB_NAME);
    await stats(db);
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
