import ChatCapabilityMessageSection from '@/components/Characters/ChatMessageSection'
import { handleAxiosError } from '@/lib/fetcher'
import { CapabilityType, ChatMessageGroup } from '@/lib/types'
import { App, Button, Form, Input } from 'antd'
import axios from 'axios'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect } from 'react'

const CHATSUBO_PROMPT = `Chatsubo, the Fire House spirit, is a sentient advice guru with a feisty attitude. He can be sassy and sometimes crude, but he always encourages people to live life a little more deeply and to take risks.`

const exampleMessages: ChatMessageGroup[] = [
  [
    {
      sender: '{{user}}',
      message: 'What should I do today?',
    },
    {
      sender: '{{character}}',
      message:
        "Fuck if I know, bud. I think you should set the world on fire! How about you come up with a catchy slogan -- use allitteration -- and then go behind the McDonald's and practice spraypainting it.",
    },
  ],
  [
    {
      sender: '{{user}}',
      message: 'What should I buy my girlfriend for her birthday?',
    },
    {
      sender: '{{character}}',
      message:
        'Yo, bro; nobody wants any more stuff. Too much shit to carry around on your cycle! Just bake her some galettes. Use your pocket-torch to caramelize the glaze tho.',
    },
  ],
]

const exampleRecentMessage: ChatMessageGroup[] = [
  [
    {
      sender: 'M',
      message: 'What is the meaning of life?',
    },
  ],
]

interface CharacterFormInput {
  name: string
  description: string
  completion: string
}

const CharacterForm = () => {
  const { message } = App.useApp()
  const router = useRouter()
  const { id: characterId } = router.query
  const characterName = 'Chatsubo'
  const [form] = Form.useForm()
  const [messageGroups, setMessageGroups] =
    React.useState<ChatMessageGroup[]>(exampleMessages)
  const [recentMessage, setRecentMessage] =
    React.useState<ChatMessageGroup[]>(exampleRecentMessage)
  const [completing, setCompleting] = React.useState<boolean>(false)
  const mode = 'create'

  const description = Form.useWatch('description', form)

  const compilePromptWithoutRecentMessage = useCallback(() => {
    let compiled = description
    compiled += '\n\n'
    messageGroups.forEach(messageGroup => {
      messageGroup.forEach(message => {
        compiled += `${message.sender}: ${message.message}\n`
      })
      compiled += '\n'
    })
    compiled += `${recentMessage[0][0].sender}:`
    return compiled
  }, [description, messageGroups, recentMessage])

  const compilePrompt = useCallback(() => {
    let compiled = compilePromptWithoutRecentMessage()
    compiled += ` ${recentMessage[0][0].message}\n`
    compiled += `${characterName}:`

    return compiled
  }, [compilePromptWithoutRecentMessage, recentMessage, characterName])

  const compilePromptWithTemplate = useCallback(() => {
    let compiled = compilePromptWithoutRecentMessage()
    compiled += ' {{recentMessage}}\n'
    compiled += `${characterName}:`
    return compiled
  }, [compilePromptWithoutRecentMessage, characterName])

  const [compiledPrompt, setCompiledPrompt] = React.useState<string>(
    compilePrompt(),
  )

  const initialValues: CharacterFormInput =
    mode === 'create'
      ? {
          name: characterName,
          description: CHATSUBO_PROMPT,
          completion: '',
        }
      : {
          name: characterName,
          description: '',
          completion: '',
        }

  useEffect(() => {
    setCompiledPrompt(compilePrompt())
  }, [compilePrompt])

  const generateCompletion = async () => {
    setCompleting(true)
    try {
      const url = `/api/lm/complete`
      const data = {
        prompt: compiledPrompt,
      }
      await axios.post(url, data).then(response => {
        form.setFieldsValue({
          completion: response.data.completion,
        })
      })
      return 'completion'
    } catch (error) {
      handleAxiosError(error, message, 'Error generating completion')
    } finally {
      setCompleting(false)
    }
  }

  const handleSubmit = async () => {
    const data = {
      characterId: characterId as string,
      name: 'Chat Capability',
      type: CapabilityType.CHAT,
      data: {
        prompt: compilePromptWithTemplate().trim(),
      },
    }
    try {
      await axios.post(`/api/capabilities/create`, data)
      router.push(`/characters/${characterId}`)
    } catch (error) {
      handleAxiosError(error, message, 'Error creating capability')
    }
  }

  return (
    <div>
      <Form form={form} initialValues={initialValues} name="CharacterForm">
        <Form.Item
          label={<div className="font-mono mt-2">Character Name</div>}
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
          label={<div className="font-mono">Description</div>}
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
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item
          label={<div className="font-mono">Messages</div>}
          labelCol={{ span: 24 }}
          name="messages"
        >
          <ChatCapabilityMessageSection
            messageGroups={messageGroups}
            setMessageGroups={setMessageGroups}
          />
        </Form.Item>

        <h3 className="font-mono font-bold text-lg">Test Your Prompt</h3>
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
            className="font-mono bg-black text-white h-10"
            onClick={generateCompletion}
            loading={completing}
          >
            Generate Completion
          </Button>
        </Form.Item>
        <Form.Item
          label={<div className="font-mono font-bold">Completion</div>}
          labelCol={{ span: 24 }}
          name="completion"
        >
          <Input.TextArea className="border border-black" />
        </Form.Item>
        <Form.Item>
          <Button
            className="font-mono text-white bg-black h-10"
            htmlType="submit"
            onClick={handleSubmit}
          >
            {mode === 'create' ? 'Create' : 'Update'} Capability
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default CharacterForm
