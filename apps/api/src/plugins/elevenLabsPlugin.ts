import axios from 'axios'
import { randomUUID } from 'crypto'
import type { FastifyInstance } from 'fastify'
import fs from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

export class ElevenLabs {
  headers: {
    accept: string
    'content-type': string
    'xi-api-key': string
  }

  constructor(apiKey: string) {
    this.headers = {
      accept: 'audio/mpeg',
      'content-type': 'application/json',
      'xi-api-key': `${apiKey}`,
    }
  }

  runTask = async (voice: string, text: string) => {
    const speechDetails = await axios.request({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      headers: this.headers,
      data: { text },
      responseType: 'arraybuffer',
    })
    //const tempFilePath = join(tmpdir(), randomUUID())
    //await fs.writeFileSync(tempFilePath, speechDetails.data)
    //return tempFilePath;
    return speechDetails.data
  }

  // startTask = async (voice: string, text: string) => {
  //   const body = {
  //     voice,
  //     content: [text],
  //   }
  //   const response = await axios.post(this.url, body, { headers: this.headers })
  //   if (response.status !== 201) {
  //     throw new Error('Failed')
  //   }
  //   const jobId = response.data.transcriptionId
  //   console.log(`Submitted job ${jobId} to PlayHT`)
  //   return jobId
  // }

  // pollForTask = async (pollingInterval: number, jobId: string) => {
  //   const urlFetch = `https://play.ht/api/v1/articleStatus?transcriptionId=${jobId}`
  //   let finished = false
  //   while (!finished) {
  //     const response = await axios.get(urlFetch, { headers: this.headers })
  //     console.log('response2', response.data)
  //     if (response.status !== 200) {
  //       throw new Error('Failed')
  //     }
  //     const { data } = response
  //     if (data.transcriped) {
  //       finished = true
  //       const audioUrl = data.audioUrl[0]
  //       console.log(`Got audio url ${audioUrl}`)
  //       return audioUrl
  //     }
  //     await new Promise(resolve => setTimeout(resolve, pollingInterval))
  //   }
  // }
}

export const registerElevenLabs = async (fastify: FastifyInstance) => {
  try {
    const elevenLabs = new ElevenLabs(process.env.ELEVENLABS_API_KEY!)
    fastify.decorate('elevenLabs', elevenLabs)
    fastify.log.info('Successfully registered ElevenLabsPlugin')
  } catch (err) {
    fastify.log.error('Plugin: elevenLabs, error on register', err)
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    elevenLabs?: ElevenLabs
  }
}

export default registerElevenLabs
