import axios from 'axios'
import axiosRetry from 'axios-retry'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

axiosRetry(axios, {
  retries: 5,
  retryDelay: retryCount => {
    return retryCount * 15000 // 15 seconds, 30, 45, 60, 75
  },
})


export class ElevenLabs {
  
  constructor(apiKey) {
    this.headers = {
      accept: 'audio/mpeg',
      'content-type': 'application/json',
      'xi-api-key': `${apiKey}`,
    }
  }

  runTask = async (
    voice,
    text
  ) => {
    const speechDetails = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      headers: this.headers,
      data: { 
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
      responseType: 'arraybuffer',
    })
    return speechDetails.data
  }
}


async function main() {
  const elevenLabs = new ElevenLabs(process.env.ELEVENLABS_API_KEY);

  const randomId = Math.random().toString(36).substring(7);
  const text = `this is a test. ${randomId} wahoo!`;
  const voice = '21m00Tcm4TlvDq8ikWAM';

  console.log(text)
  console.log(voice);

  // const audio = await elevenLabs.runTask(voice, text);
  const audioBuffer = await elevenLabs.runTask(voice, text)
  //console.log(audio)
  fs.writeFileSync(`test_${randomId}.mp3`, audioBuffer);
}

main();