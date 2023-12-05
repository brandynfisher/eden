import ChatCapabilityMessageSection from '@/components/Characters/ChatMessageSection'
import UploadParameter from '@/components/Creation/CreationInterface/parameters/UploadParameter'
import FormLabel from '@/components/Forms/FormLabel'
import PrivacyToggle from '@/components/Forms/PrivacyToggle'
import { compilePrompt, messageGroupsToDialogueString } from '@/lib/chat'
import { handleAxiosError } from '@/lib/fetcher'
import { ChatMessageGroup } from '@/lib/types'
import { UserContext } from '@/providers/UserProvider'
import RobotOutlined from '@ant-design/icons/RobotOutlined'
import { Character } from '@edenlabs/eden-sdk'
import { App, Button, Form, Input, Select } from 'antd'
import axios from 'axios'
import { useRouter } from 'next/router'
import React, { useContext, useEffect, useState } from 'react'

const EXAMPLE_CHARACTER = {
  name: 'Abraham',
  description:
    'Abraham is an artificial artist, an AI who creates unique and original artworks.',
  greeting:
    'Greetings. I am Abraham, an artificial artist. I am glad to meet you.',
}

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

const exampleRecentMessage: ChatMessageGroup[] = [
  [
    {
      sender: 'user',
      message: 'Who are you?',
    },
  ],
]

interface CharacterFormInput {
  name: string
  image: string
  voice: string
  description: string
  greeting: string
  completion: string
  dialogue?: string
  isPrivate?: boolean
}

function coupledArray<T>(array: T[]): T[][] {
  return Array.from({ length: Math.ceil(array.length / 2) }, (_, i) =>
    array.slice(i * 2, i * 2 + 2),
  )
}

const CharacterToolButtons = ({ character }: { character: Character }) => {
  const { message } = App.useApp()
  const router = useRouter()

  const handleDeleteCharacter = async () => {
    try {
      await axios.post(`/api/characters/delete`, {
        characterId: character.id,
      })
      message.destroy()
      message.info(`Character '${character.name}' was deleted`)
      await router.push('/create/characters')
    } catch (error) {
      handleAxiosError(error, message)
    }
  }

  const handleCancel = async () => {
    await router.push('/create/characters')
  }

  return (
    <div className="flex flex-grow justify-between gap-2">
      <div className="flex gap-2">
        <Button type="text" className="font-mono" onClick={handleCancel}>
          Back to list
        </Button>
      </div>

      <Button
        type="text"
        className="font-mono"
        danger
        onClick={handleDeleteCharacter}
      >
        Delete character
      </Button>
    </div>
  )
}

const CharacterForm = ({ character }: { character?: Character }) => {
  const mode = !character ? 'create' : 'update'
  const { message } = App.useApp()
  const { user } = useContext(UserContext)
  const router = useRouter()
  const [form] = Form.useForm()
  const [messageGroups, setMessageGroups] = useState<ChatMessageGroup[]>([])
  const [recentMessage, setRecentMessage] =
    useState<ChatMessageGroup[]>(exampleRecentMessage)
  const [completing, setCompleting] = useState<boolean>(false)
  const [usedCompletion, setUsedCompletion] = useState<boolean>(false)

  const characterName = Form.useWatch('name', form)
  const description = Form.useWatch('description', form)

  useEffect(() => {
    const formValues: CharacterFormInput =
      mode === 'update' && character
        ? {
            name: character?.name,
            description: character?.description || '',
            greeting: character?.greeting || '',
            completion: '',
            image: character?.image || '',
            voice: character?.voice || '',
            isPrivate: character?.isPrivate || false,
          }
        : {
            name: '',
            description: '',
            greeting: '',
            completion: '',
            image: '',
            voice: '',
            isPrivate: false,
          }

    form.setFieldsValue(formValues)

    const characterDialogue = character?.dialogue
      ? (coupledArray(character.dialogue) as ChatMessageGroup[])
      : []

    setMessageGroups(mode === 'create' ? [] : characterDialogue)
  }, [form, mode, character])

  const generateCompletion = async () => {
    setUsedCompletion(true)
    setCompleting(true)
    try {
      const url = `/api/lm/complete`
      const dialogue = messageGroupsToDialogueString(messageGroups)
      const prompt = compilePrompt(
        characterName,
        recentMessage[0][0],
        description,
        dialogue,
      )
      const data = {
        prompt,
      }
      const response = await axios.post(url, data)
      const completion = response.data.completion as string
      const fmtCompletion = completion.trim()
      form.setFieldsValue({
        completion: fmtCompletion,
      })
    } catch (error) {
      handleAxiosError(error, message, 'Error generating completion')
    } finally {
      setCompleting(false)
    }
  }

  const handleSubmit = async () => {
    const data = {
      name: characterName,
      description: form.getFieldValue('description'),
      greeting: form.getFieldValue('greeting'),
      image: form.getFieldValue('image'),
      voice: form.getFieldValue('voice'),
      dialogue: messageGroups.flat(),
      isPrivate: form.getFieldValue('isPrivate'),
    }

    try {
      if (mode === 'create') {
        await axios.post(`/api/characters/create`, data)
      } else {
        await axios.patch(`/api/characters/${character?.id}`, {
          ...data,
          characterId: character?.id,
        })
      }

      message.destroy()
      message.success(`Character '${data.name}' ${mode}d`)
      await router.push(`/create/characters`)
    } catch (error) {
      handleAxiosError(error, message, 'Error creating/updating character')
    }
  }

  return (
    <div>
      <Form form={form} name="CharacterForm">
        <Form.Item
          label={
            <FormLabel
              text="Name"
              description="What should your character be called?"
            />
          }
          className="label-auto-height"
          labelCol={{ span: 24 }}
          name="name"
          rules={[
            { required: true, message: 'Please input a character name!' },
            {
              min: 3,
              max: 20,
              message: 'Character name must be between 3 and 20 characters!',
            },
          ]}
        >
          <Input placeholder={EXAMPLE_CHARACTER.name} />
        </Form.Item>
        <Form.Item
          label={
            <FormLabel
              text="Description"
              description="Describe your character and shape its personality"
            />
          }
          className="label-auto-height"
          labelCol={{ span: 24 }}
          name="description"
          rules={[
            { required: true, message: 'Please input a description!' },
            {
              min: 3,
              max: 1000,
              message: 'Description must be between 3 and 1000 characters!',
            },
          ]}
        >
          <Input.TextArea
            autoSize
            placeholder={EXAMPLE_CHARACTER.description}
          />
        </Form.Item>

        <Form.Item
          label={
            <FormLabel
              text="Portrait"
              description="Used as an avatar for your character. If mouth is visible, it will be animated when your character speaks. Portrait orientation recommended."
            />
          }
          className="label-auto-height"
          labelCol={{ span: 24 }}
          name="image"
        >
          <UploadParameter
            form={form}
            parameter={{
              name: 'image',
              label: '',
              maxLength: 1,
              default: (character && character.image) || '',
            }}
            key={'image'}
            acceptedMimeTypes={'image/png, image/jpeg, image/webp'}
          />
        </Form.Item>
        <Form.Item
          label={
            <FormLabel
              text="Voice"
              description="(Optional) Your character will speak with this voice. Voices provided by ElevenLabs."
            />
          }
          className="label-auto-height"
          labelCol={{ span: 24 }}
          name="voice"
        >
          <Select>
            {ELEVENLABS_VOICES.map(voice => (
              <Select.Option key={voice.id} value={voice.id}>
                {voice.name}, {voice.accent}, {voice.age}, {voice.gender},{' '}
                {voice.description}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label={
            <FormLabel
              text="Greeting"
              description="Your Character will introduce themselves with this message when entering a conversation"
            />
          }
          className="label-auto-height"
          labelCol={{ span: 24 }}
          name="greeting"
          rules={[
            {
              min: 3,
              max: 1000,
              message: 'Greeting must be between 3 and 1000 characters!',
            },
          ]}
        >
          <Input.TextArea autoSize placeholder={EXAMPLE_CHARACTER.greeting} />
        </Form.Item>
        <Form.Item
          label={
            <FormLabel
              text="Example Messages"
              description="Add sample dialogs to further refine the personality of your character"
            />
          }
          className="label-auto-height"
          labelCol={{ span: 24 }}
          name="messages"
        >
          <ChatCapabilityMessageSection
            messageGroups={messageGroups}
            setMessageGroups={setMessageGroups}
          />
        </Form.Item>

        <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg mb-4">
          <h3 className="font-mono font-bold text-lg">Test Your Character</h3>
          <div>
            <Form.Item
              labelCol={{ span: 24 }}
              style={{ marginBottom: 0 }}
              name="recent"
            >
              <ChatCapabilityMessageSection
                messageGroups={recentMessage}
                setMessageGroups={setRecentMessage}
                showControls={false}
              />
            </Form.Item>
            <Form.Item>
              <Button
                className="font-mono"
                onClick={generateCompletion}
                loading={completing}
              >
                Generate Response
              </Button>
            </Form.Item>

            <div className={`${!usedCompletion ? 'hidden' : ''}`}>
              <div className="flex gap-2 items-center">
                <div>{characterName}</div>
                <div
                  title="Character Generated Response"
                  className="flex items-center cursor-pointer"
                >
                  <RobotOutlined />
                </div>
              </div>
              <Form.Item
                labelCol={{ span: 24 }}
                name="completion"
                className={`mb-0`}
              >
                <Input.TextArea
                  className="border-none mt-1 bg-blue-200 dark:!bg-indigo-900 !rounded-lg !rounded-tl-none"
                  readOnly
                  autoSize
                  disabled={completing}
                />
              </Form.Item>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-between items-center">
          <Form.Item>
            <Button
              className="font-mono h-10"
              htmlType="submit"
              onClick={handleSubmit}
            >
              {mode === 'create' ? 'Create' : 'Update'} Character
            </Button>
            {character && <CharacterToolButtons character={character} />}
          </Form.Item>

          {user &&
          user.featureFlags &&
          user.featureFlags.includes('preview') ? (
            <PrivacyToggle />
          ) : null}
        </div>
      </Form>
    </div>
  )
}

export default CharacterForm
