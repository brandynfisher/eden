import {EdenClient} from "@edenlabs/eden-sdk";
import fs from "fs";
import fetch from "node-fetch";
import path from 'path';
import axios from 'axios';
import { promisify } from 'util';
import FormData from 'form-data';
import dotenv from 'dotenv';
dotenv.config();


const EDEN_API_KEY = process.env.EDEN_API_KEY;
const EDEN_API_SECRET = process.env.EDEN_API_SECRET;;

const eden = new EdenClient({
  edenApiUrl: "http://0.0.0.0:5050",
  apiKey: EDEN_API_KEY,
  apiSecret: EDEN_API_SECRET,
});

// async function uploadFile(filePath) {
//   const readFileAsync = promisify(fs.readFile);
//   const media = await readFileAsync(filePath);
//   const form = new FormData();
//   form.append('media', media);
//   const authHeader = {
//     "x-api-key": EDEN_API_KEY,
//     "x-api-secret": EDEN_API_SECRET,
//     'Content-Type': 'multipart/form-data',
//   };
//   const response = await axios.post(
//     `https://api.eden.art/media/upload`,
//     form,
//     { headers: { ...authHeader, ...form.getHeaders() } }
//   );
//   return response.data;
// }

// async function downloadImage(url, filename) {
//   const response = await fetch(url);
//   const arrayBuffer = await response.arrayBuffer();
//   fs.writeFile(filename, Buffer.from(arrayBuffer), (err) => {
//     if (err) {
//       console.error(err);
//     } else {
//       console.log(`Successfully saved ${filename}`);
//     }
//   });
// }

const pollForTask = async function(pollingInterval, taskId) {
  let finished = false;
  while (!finished) {
    const taskResult = await eden.tasks.get({taskId: taskId});
    console.log(taskResult);
    if (taskResult.task.status == "faled") {
      throw new Error('Failed')
    }
    else if (taskResult.task.status == "completed") {
      finished = true;
      const url = taskResult.task.output.files[0];
      return url;
    }
    await new Promise(resolve => setTimeout(resolve, pollingInterval))
  }
}

async function generateMonologue() {
  try {
    const config = {
      prompt: "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
    };

    console.log(config);

    const taskResult = await eden.tasks.create({
      generatorName: "monologue", 
      config: config
    });
    
    const result = await pollForTask(5000, taskResult.taskId);
    console.log(result);

  } catch (e) {
    console.log(e);
  }
}

generateMonologue();