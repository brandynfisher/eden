import axios from 'axios';
import { promisify } from 'util';
import FormData from 'form-data';
import fs from 'fs';
import { MongoClient } from 'mongodb';
import { EdenClient } from '@edenlabs/eden-sdk';
import { Configuration, OpenAIApi } from "openai";
import dotenv from 'dotenv';
dotenv.config();


const EDEN_API_KEY = process.env.EDEN_API_KEY;
const EDEN_API_SECRET = process.env.EDEN_API_SECRET;
const MONGO_URI = process.env.MONGO_URI;
const ELEVENLABS_API_TOKEN = process.env.ELEVENLABS_API_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

console.log(MONGO_URI)
console.log("beginning task runner");
const client = new MongoClient(MONGO_URI);  


const main = async () => {
  await client.connect();

  const characters = client.db('eden').collection('characters');
  const scenarios = client.db('eden').collection('scenarios');
  const sessions = client.db('eden').collection('sessions');
  const sessionEvents = client.db('eden').collection('sessionEvents');

  console.log(await characters.find({}).toArray());






  // while (true) {
  //   console.log("hello world");
  //   await new Promise((resolve) => setTimeout(resolve, 5000));
  // }
}


main();
