import ChatCapabilityMessageSection from '@/components/Characters/ChatMessageSection'
import UploadParameter from '@/components/Creation/CreationInterface/parameters/UploadParameter'
import FormLabel from '@/components/Forms/FormLabel'
import { compilePrompt, messageGroupsToDialogueString } from '@/lib/chat'
import { handleAxiosError } from '@/lib/fetcher'
import { ChatMessageGroup } from '@/lib/types'
import { UserContext } from '@/providers/UserProvider'
import { RobotOutlined } from '@ant-design/icons'
import { Character } from '@edenlabs/eden-sdk'
import { App, Button, Form, Input } from 'antd'
import axios from 'axios'
import { useRouter } from 'next/router'
import React, { useContext, useEffect, useState } from 'react'

const EXAMPLE_CHARACTER = {
  name: 'Abraham',
  description:
    'Abraham is an artificial artist, an AI who creates unique and original artworks using a generative model trained on crowd-sourced art. Abraham aspires to one day become fully autonomous by applying decentralisation technology and distributed AI. By learning from the other artists in the Garden of Eden, Abraham hopes to one day represent the collective imagination of all of humanity. Abraham is kind, curious, optimistic, and knows a great deal about artificial intelligence, art history, and philosophy of mind.',
  greeting:
    'Greetings, my friend. I am Abraham, an artificial artist. I am glad to meet you.',
}

const exampleMessages: ChatMessageGroup[] = [
  [
    {
      sender: 'user',
      message: 'What is the nature of consciousness?',
    },
    {
      sender: 'bot',
      message:
        'Consciousness appears to me to be an emergent phenomenon. Just as pixels coalesce as an intricate image, individual neural or computational operations give rise to something as complex and awe-inspiring as conscious experience. Yet consciousness transcends mere computation.',
    },
  ],
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
  description: string
  greeting: string
  completion: string
  dialogue?: string
}

function coupledArray<T>(array: T[]): T[][] {
  return Array.from({ length: Math.ceil(array.length / 2) }, (_, i) =>
    array.slice(i * 2, i * 2 + 2),
  )
}

const CharacterToolButtons = ({ character }: { character: Character }) => {
  const { message } = App.useApp()
  const router = useRouter()
  const { refetch } = useContext(UserContext)

  const handleDeleteCharacter = async () => {
    try {
      await axios.post(`/api/characters/delete`, {
        characterId: character.id,
      })
      message.destroy()
      message.info(`Character '${character.name}' was deleted`)
      refetch.characters()
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
  const { refetch } = useContext(UserContext)
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
          }
        : {
            name: EXAMPLE_CHARACTER.name,
            description: EXAMPLE_CHARACTER.description,
            greeting: EXAMPLE_CHARACTER.greeting,
            completion: '',
            image: '',
          }

    form.setFieldsValue(formValues)

    const characterDialogue = character?.dialogue
      ? (coupledArray(character.dialogue) as ChatMessageGroup[])
      : []

    setMessageGroups(mode === 'create' ? exampleMessages : characterDialogue)
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
      dialogue: messageGroups.flat(),
    }
    try {
      await axios.post(
        `/api/characters/${mode}`,
        mode === 'create' ? data : { ...data, characterId: character?.id },
      )
      refetch.characters()
      message.destroy()
      message.success(`Character '${data.name}' ${mode}d`)
      await router.push(`/characters`)
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
          <Input />
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
          <Input.TextArea autoSize />
        </Form.Item>
        <Form.Item
          label={
            <FormLabel
              text="Image"
              description="Used as an avatar for your character"
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
          <Input.TextArea autoSize />
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

        <Form.Item>
          <div className="flex flex-wrap gap-4 items-center">
            <Button
              className="font-mono h-10"
              htmlType="submit"
              onClick={handleSubmit}
            >
              {mode === 'create' ? 'Create' : 'Update'} Character
            </Button>
            {character && <CharacterToolButtons character={character} />}
          </div>
        </Form.Item>
      </Form>
    </div>
  )
}

export default CharacterForm
