import axios from 'axios'
// import axiosRetry from 'axios-retry'
import type { FastifyInstance } from 'fastify'

// axiosRetry(axios, {
//   retries: 5,
//   retryDelay: retryCount => {
//     return retryCount * 15000 // 15 seconds, 30, 45, 60, 75
//   },
// })

const ELEVENLABS_VOICES = [
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    accent: 'American',
    age: 'young',
    gender: 'female',
    description: 'calm',
  },
  {
    id: '2EiwWnXFnvU5JabPnv8n',
    name: 'Clyde',
    accent: 'American',
    age: 'middle aged',
    gender: 'male',
    description: 'war veteran',
  },
  {
    id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Domi',
    accent: 'American',
    age: 'young',
    gender: 'female',
    description: 'strong',
  },
  {
    id: 'CYw3kZ02Hs0563khs1Fj',
    name: 'Dave',
    accent: 'British-essex',
    age: 'young',
    gender: 'male',
    description: 'conversational',
  },
  {
    id: 'D38z5RcWu1voky8WS1ja',
    name: 'Fin',
    accent: 'Irish',
    age: 'old',
    gender: 'male',
    description: 'sailor',
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    accent: 'American',
    age: 'young',
    gender: 'female',
    description: 'soft',
  },
  {
    id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    accent: 'American',
    age: 'young',
    gender: 'male',
    description: 'well-rounded',
  },
  {
    id: 'GBv7mTt0atIp3Br8iCZE',
    name: 'Thomas',
    accent: 'American',
    age: 'young',
    gender: 'male',
    description: 'calm',
  },
  {
    id: 'IKne3meq5aSn9XLyUdCD',
    name: 'Charlie',
    accent: 'Australian',
    age: 'middle aged',
    gender: 'male',
    description: 'casual',
  },
  {
    id: 'LcfcDJNUP1GQjkzn1xUU',
    name: 'Emily',
    accent: 'American',
    age: 'young',
    gender: 'female',
    description: 'calm',
  },
  {
    id: 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Elli',
    accent: 'American',
    age: 'young',
    gender: 'female',
    description: 'emotional',
  },
  {
    id: 'N2lVS1w4EtoT3dr4eOWO',
    name: 'Callum',
    accent: 'American',
    age: 'middle aged',
    gender: 'male',
    description: 'hoarse',
  },
  {
    id: 'ODq5zmih8GrVes37Dizd',
    name: 'Patrick',
    accent: 'American',
    age: 'middle aged',
    gender: 'male',
    description: 'shouty',
  },
  {
    id: 'SOYHLrjzK2X1ezoPC6cr',
    name: 'Harry',
    accent: 'American',
    age: 'young',
    gender: 'male',
    description: 'anxious',
  },
  {
    id: 'TX3LPaxmHKxFdv7VOQHJ',
    name: 'Liam',
    accent: 'American',
    age: 'young',
    gender: 'male',
    description: 'neutral',
  },
  {
    id: 'ThT5KcBeYPX3keUQqHPh',
    name: 'Dorothy',
    accent: 'British',
    age: 'young',
    gender: 'female',
    description: 'pleasant',
  },
  {
    id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    accent: 'American',
    age: 'young',
    gender: 'male',
    description: 'deep',
  },
  {
    id: 'VR6AewLTigWG4xSOukaG',
    name: 'Arnold',
    accent: 'American',
    age: 'middle aged',
    gender: 'male',
    description: 'crisp',
  },
  {
    id: 'XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte',
    accent: 'English-swedish',
    age: 'middle aged',
    gender: 'female',
    description: 'seductive',
  },
  {
    id: 'XrExE9yKIg1WjnnlVkGX',
    name: 'Matilda',
    accent: 'American',
    age: 'young',
    gender: 'female',
    description: 'warm',
  },
  {
    id: 'Yko7PKHZNXotIFUBG7I9',
    name: 'Matthew',
    accent: 'British',
    age: 'middle aged',
    gender: 'male',
    description: 'calm',
  },
  {
    id: 'ZQe5CZNOzWyzPSCn5a3c',
    name: 'James',
    accent: 'Australian',
    age: 'old',
    gender: 'male',
    description: 'calm ',
  },
  {
    id: 'Zlb1dXrM653N07WRdFW3',
    name: 'Joseph',
    accent: 'British',
    age: 'middle aged',
    gender: 'male',
    description: 'ground reporter ',
  },
  {
    id: 'bVMeCyTHy58xNoL34h3p',
    name: 'Jeremy',
    accent: 'American-irish',
    age: 'young',
    gender: 'male',
    description: 'excited',
  },
  {
    id: 'flq6f7yk4E4fJM5XTYuZ',
    name: 'Michael',
    accent: 'American',
    age: 'old',
    gender: 'male',
    description: 'orotund',
  },
  {
    id: 'g5CIjZEefAph4nQFvHAz',
    name: 'Ethan',
    accent: 'American',
    age: 'young',
    gender: 'male',
    description: 'whisper',
  },
  {
    id: 'jBpfuIE2acCO8z3wKNLl',
    name: 'Gigi',
    accent: 'American',
    age: 'young',
    gender: 'female',
    description: 'childlish',
  },
  {
    id: 'jsCqWAovK2LkecY7zXl4',
    name: 'Freya',
    accent: 'American',
    age: 'young',
    gender: 'female',
    description: 'overhyped',
  },
  {
    id: 'oWAxZDx7w5VEj9dCyTzz',
    name: 'Grace',
    accent: 'American-southern',
    age: 'young',
    gender: 'female',
    description: 'gentle',
  },
  {
    id: 'onwK4e9ZLuTAKqWW03F9',
    name: 'Daniel',
    accent: 'British',
    age: 'middle aged',
    gender: 'male',
    description: 'deep',
  },
  {
    id: 'pMsXgVXv3BLzUgSXRplE',
    name: 'Serena',
    accent: 'American',
    age: 'middle aged',
    gender: 'female',
    description: 'pleasant',
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    accent: 'American',
    age: 'middle aged',
    gender: 'male',
    description: 'deep',
  },
  {
    id: 'piTKgcLEGmPE4e6mEKli',
    name: 'Nicole',
    accent: 'American',
    age: 'young',
    gender: 'female',
    description: 'whisper',
  },
  {
    id: 't0jbNlBVZ17f02VDIeMI',
    name: 'Jessie',
    accent: 'American',
    age: 'old',
    gender: 'male',
    description: 'raspy ',
  },
  {
    id: 'wViXBPUzp2ZZixB1xQuM',
    name: 'Ryan',
    accent: 'American',
    age: 'middle aged',
    gender: 'male',
    description: 'soldier',
  },
  {
    id: 'yoZ06aMxZJJ28mfd3POQ',
    name: 'Sam',
    accent: 'American',
    age: 'young',
    gender: 'male',
    description: 'raspy',
  },
  {
    id: 'z9fAnlkpzviPz146aGWa',
    name: 'Glinda',
    accent: 'American',
    age: 'middle aged',
    gender: 'female',
    description: 'witch',
  },
  {
    id: 'zcAOhNBS3c14rBihAFp1',
    name: 'Giovanni',
    accent: 'English-Italian',
    age: 'young',
    gender: 'male',
    description: 'foreigner',
  },
  {
    id: 'zrHiDhphv9ZnVXBqCLjz',
    name: 'Mimi',
    accent: 'English-Swedish',
    age: 'young',
    gender: 'female',
    description: 'childish',
  },
  {
    id: 'CZp29scZOSoxMqFcYmze',
    name: 'Sneha',
    accent: 'Indian',
    age: 'young',
    gender: 'female',
    description: 'emotion',
  },
  {
    id: 'G7hPHGippt7BA8acGdsa',
    name: 'Theresa',
    accent: 'American',
    age: 'middle_aged',
    gender: 'female',
    description: 'emotional',
  },
  {
    id: 'PGOHvGnadsOnXlaTzrCo',
    name: 'Ava',
    accent: 'British',
    age: 'middle_aged',
    gender: 'female',
    description: 'no description',
  },
  {
    id: 'QeU7Jyb1zlyMRNmeVMn8',
    name: 'Samantha',
    accent: 'African',
    age: 'middle_aged',
    gender: 'female',
    description: 'no description',
  },
  {
    id: 'gOHA0Bonqx0FpJUQNKwx',
    name: 'Gabriella',
    accent: 'American',
    age: 'middle_aged',
    gender: 'female',
    description: 'sexy',
  },
  {
    id: 'iHd2P7DWshWVJY3ysgn9',
    name: 'Narrator',
    accent: 'Indian',
    age: 'middle_aged',
    gender: 'male',
    description: 'no description',
  },
  {
    id: 'jSVfKGqPR4z4zigtGn9c',
    name: 'Travis',
    accent: 'American',
    age: 'young',
    gender: 'male',
    description: 'no description',
  },
  {
    id: 'k6C2Vdm7MTjFRPi5N7J0',
    name: 'Zuri',
    accent: 'African',
    age: 'old',
    gender: 'female',
    description: 'no description',
  },
  {
    id: 'kr7Ew5AGZ31MdNKOyg8c',
    name: 'Ira',
    accent: 'Indian',
    age: 'young',
    gender: 'female',
    description: 'slow, seductive, pleasant, mature',
  },
  {
    id: 'pNtQC7QjAE8BYR0FsSAo',
    name: 'Aphrodite',
    accent: 'American',
    age: 'young',
    gender: 'female',
    description: 'no description',
  },
  {
    id: 'rBVX8bMJbuJvjpulhWSA',
    name: 'Computer AI',
    accent: 'Indian',
    age: 'middle_aged',
    gender: 'male',
    description: 'fiction',
  },
]

export class ElevenLabs {
  voices: any[]
  headers: {
    accept: string
    'content-type': string
    'xi-api-key': string
  }

  constructor(apiKey: string) {
    this.voices = ELEVENLABS_VOICES
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
    return speechDetails.data
  }
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
