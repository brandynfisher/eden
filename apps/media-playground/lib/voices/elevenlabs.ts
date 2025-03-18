export type ElevenLabsVoice = {
  id: string
  name: string
  accent: string
  age: string
  gender: 'male' | 'female' | 'neutral'
  description?: string
  use_case?: string
  preview_url: string
}

export const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  {
    id: '9BWtsMINqrJLrRacOk9x',
    name: 'Aria',
    accent: 'American',
    age: 'middle-aged',
    gender: 'female',
    description: 'expressive',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/9BWtsMINqrJLrRacOk9x/405766b8-1f4e-4d3c-aba1-6f25333823ec.mp3',
    use_case: 'social media',
  },
  {
    id: 'CwhRBWXzGAHq8TQ4Fs17',
    name: 'Roger',
    accent: 'American',
    age: 'middle-aged',
    gender: 'male',
    description: 'confident',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/CwhRBWXzGAHq8TQ4Fs17/58ee3ff5-f6f2-4628-93b8-e38eb31806b0.mp3',
    use_case: 'social media',
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    accent: 'american',
    age: 'young',
    gender: 'female',
    description: 'soft',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/01a3e33c-6e99-4ee7-8543-ff2216a32186.mp3',
    use_case: 'news',
  },
  {
    id: 'FGY2WhTYpPnrIDTdsKH5',
    name: 'Laura',
    accent: 'American',
    age: 'young',
    gender: 'female',
    description: 'upbeat',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/FGY2WhTYpPnrIDTdsKH5/67341759-ad08-41a5-be6e-de12fe448618.mp3',
    use_case: 'social media',
  },
  {
    id: 'IKne3meq5aSn9XLyUdCD',
    name: 'Charlie',
    accent: 'Australian',
    age: 'middle aged',
    gender: 'male',
    description: 'natural',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/IKne3meq5aSn9XLyUdCD/102de6f2-22ed-43e0-a1f1-111fa75c5481.mp3',
    use_case: 'conversational',
  },
  {
    id: 'JBFqnCBsd6RMkjVDRZzb',
    name: 'George',
    accent: 'British',
    age: 'middle aged',
    gender: 'male',
    description: 'warm',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/JBFqnCBsd6RMkjVDRZzb/e6206d1a-0721-4787-aafb-06a6e705cac5.mp3',
    use_case: 'narration',
  },
  {
    id: 'N2lVS1w4EtoT3dr4eOWO',
    name: 'Callum',
    accent: 'Transatlantic',
    age: 'middle-aged',
    gender: 'male',
    description: 'intense',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/N2lVS1w4EtoT3dr4eOWO/ac833bd8-ffda-4938-9ebc-b0f99ca25481.mp3',
    use_case: 'characters',
  },
  {
    id: 'SAz9YHcvj6GT2YYXdXww',
    name: 'River',
    accent: 'American',
    age: 'middle-aged',
    gender: 'neutral',
    description: 'confident',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/SAz9YHcvj6GT2YYXdXww/e6c95f0b-2227-491a-b3d7-2249240decb7.mp3',
    use_case: 'social media',
  },
  {
    id: 'TX3LPaxmHKxFdv7VOQHJ',
    name: 'Liam',
    accent: 'American',
    age: 'young',
    gender: 'male',
    description: 'articulate',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/TX3LPaxmHKxFdv7VOQHJ/63148076-6363-42db-aea8-31424308b92c.mp3',
    use_case: 'narration',
  },
  {
    id: 'XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte',
    accent: 'Swedish',
    age: 'young',
    gender: 'female',
    description: 'seductive',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/XB0fDUnXU5powFXDhCwa/942356dc-f10d-4d89-bda5-4f8505ee038b.mp3',
    use_case: 'characters',
  },
  {
    id: 'Xb7hH8MSUJpSbSDYk0k2',
    name: 'Alice',
    accent: 'British',
    age: 'middle-aged',
    gender: 'female',
    description: 'confident',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/Xb7hH8MSUJpSbSDYk0k2/d10f7534-11f6-41fe-a012-2de1e482d336.mp3',
    use_case: 'news',
  },
  {
    id: 'XrExE9yKIg1WjnnlVkGX',
    name: 'Matilda',
    accent: 'American',
    age: 'middle-aged',
    gender: 'female',
    description: 'friendly',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/XrExE9yKIg1WjnnlVkGX/b930e18d-6b4d-466e-bab2-0ae97c6d8535.mp3',
    use_case: 'narration',
  },
  {
    id: 'bIHbv24MWmeRgasZH58o',
    name: 'Will',
    accent: 'American',
    age: 'young',
    gender: 'male',
    description: 'friendly',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/bIHbv24MWmeRgasZH58o/8caf8f3d-ad29-4980-af41-53f20c72d7a4.mp3',
    use_case: 'social media',
  },
  {
    id: 'cgSgspJ2msm6clMCkdW9',
    name: 'Jessica',
    accent: 'American',
    age: 'young',
    gender: 'female',
    description: 'expressive',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/cgSgspJ2msm6clMCkdW9/56a97bf8-b69b-448f-846c-c3a11683d45a.mp3',
    use_case: 'conversational',
  },
  {
    id: 'cjVigY5qzO86Huf0OWal',
    name: 'Eric',
    accent: 'American',
    age: 'middle-aged',
    gender: 'male',
    description: 'friendly',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/cjVigY5qzO86Huf0OWal/d098fda0-6456-4030-b3d8-63aa048c9070.mp3',
    use_case: 'conversational',
  },
  {
    id: 'iP95p4xoKVk53GoZ742B',
    name: 'Chris',
    accent: 'American',
    age: 'middle-aged',
    gender: 'male',
    description: 'casual',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/iP95p4xoKVk53GoZ742B/3f4bde72-cc48-40dd-829f-57fbf906f4d7.mp3',
    use_case: 'conversational',
  },
  {
    id: 'nPczCjzI2devNBz1zQrb',
    name: 'Brian',
    accent: 'American',
    age: 'middle-aged',
    gender: 'male',
    description: 'deep',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/nPczCjzI2devNBz1zQrb/2dd3e72c-4fd3-42f1-93ea-abc5d4e5aa1d.mp3',
    use_case: 'narration',
  },
  {
    id: 'onwK4e9ZLuTAKqWW03F9',
    name: 'Daniel',
    accent: 'British',
    age: 'middle-aged',
    gender: 'male',
    description: 'authoritative',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/onwK4e9ZLuTAKqWW03F9/7eee0236-1a72-4b86-b303-5dcadc007ba9.mp3',
    use_case: 'news',
  },
  {
    id: 'pFZP5JQG7iQjIQuC4Bku',
    name: 'Lily',
    accent: 'British',
    age: 'middle-aged',
    gender: 'female',
    description: 'warm',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/pFZP5JQG7iQjIQuC4Bku/89b68b35-b3dd-4348-a84a-a3c13a3c2b30.mp3',
    use_case: 'narration',
  },
  {
    id: 'pqHfZKP75CvOlQylNhV4',
    name: 'Bill',
    accent: 'American',
    age: 'old',
    gender: 'male',
    description: 'trustworthy',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/pqHfZKP75CvOlQylNhV4/d782b3ff-84ba-4029-848c-acf01285524d.mp3',
    use_case: 'narration',
  },
]
