import CharacterFormPro from '@/components/Characters/CharacterFormPro'
import ChatCapabilityMessageSection from '@/components/Characters/ChatMessageSection'
import { ELEVENLABS_VOICES } from '@/components/Characters/elevenlabs'
import ConceptSelectModalTrigger from '@/components/Creation/CreationInterface/ConceptSelectModalTrigger'
import ParameterAddon from '@/components/Creation/CreationInterface/parameters/ParameterAddon'
import UploadParameter from '@/components/Creation/CreationInterface/parameters/UploadParameter'
import FormLabel from '@/components/Forms/FormLabel'
import PrivacyToggle from '@/components/Forms/PrivacyToggle'
import { compilePrompt, messageGroupsToDialogueString } from '@/lib/chat'
import { handleAxiosError } from '@/lib/fetcher'
import { ChatMessageGroup } from '@/lib/types'
import { UserContext } from '@/providers/UserProvider'
import RobotOutlined from '@ant-design/icons/RobotOutlined'
import { Character } from '@edenlabs/eden-sdk'
import { App, Button, Form, Input, Select, Switch } from 'antd'
import axios from 'axios'
import { ConfirmProvider, useConfirm } from 'material-ui-confirm'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { useContext, useEffect, useState } from 'react'

const EXAMPLE_CHARACTER = {
  name: 'Abraham',
  description:
    'Abraham is an artificial artist, an AI who creates unique and original artworks.',
  greeting:
    'Greetings. I am Abraham, an artificial artist. I am glad to meet you.',
}

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
  concept?: string
  dialogue?: string
  logosDocumentation?: string
  logosDocumentationPrompt?: string
  logosRouterPrompt?: string
  logosCreatorPrompt?: string
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
  const confirm = useConfirm()

  const confirmDelete = () => {
    confirm({
      description: (
        <div>
          This will permanently delete the character{' '}
          <strong>{character.name}</strong>.
        </div>
      ),
      confirmationText: 'Delete',
      confirmationButtonProps: { color: 'warning' },
    })
      .then(() => handleDeleteCharacter())
      .catch(() => console.log('Deletion cancelled.'))
  }

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

  // const handleCancel = async () => {
  //   await router.push('/create/characters')
  // }

  return (
    <div className="flex flex-grow justify-between gap-2">
      {/*<div className="flex gap-2">*/}
      {/*  <Button type="text" className="font-mono" onClick={handleCancel}>*/}
      {/*    Back to list*/}
      {/*  </Button>*/}
      {/*</div>*/}

      <Button
        type="text"
        className="font-mono ml-auto"
        danger
        onClick={confirmDelete}
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
  const [recentMessage, setRecentMessage] =
    useState<ChatMessageGroup[]>(exampleRecentMessage)
  const [messageGroups, setMessageGroups] = useState<ChatMessageGroup[]>([])
  const [completing, setCompleting] = useState<boolean>(false)
  const [usedCompletion, setUsedCompletion] = useState<boolean>(false)
  const [proMode, setProMode] = useState<boolean>(false)

  const characterName = Form.useWatch('name', form)
  const description = Form.useWatch('description', form)
  const concept = Form.useWatch('concept', form)
  const characterImageFieldValue = Form.useWatch('image', form) as {} | string

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
            concept: character?.concept || '',
            logosDocumentation: character?.logosData?.documentation || '',
            logosDocumentationPrompt:
              character?.logosData?.documentationPrompt || '',
            logosRouterPrompt: character?.logosData?.routerPrompt || '',
            logosCreatorPrompt: character?.logosData?.creatorPrompt || '',
            isPrivate: character?.isPrivate || false,
          }
        : {
            name: '',
            description: '',
            greeting: '',
            completion: '',
            image: '',
            voice: '',
            concept: '',
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
      concept: form.getFieldValue('concept'),
      logosData: {
        documentation: form.getFieldValue('logosDocumentation'),
        documentationPrompt: form.getFieldValue('logosDocumentationPrompt'),
        routerPrompt: form.getFieldValue('logosRouterPrompt'),
        creatorPrompt: form.getFieldValue('logosCreatorPrompt'),
      },
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
    <ConfirmProvider>
      <div>
        <Form form={form} name="CharacterForm">
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 ">
            <div className="p-4 bg-gray-100 dark:bg-stone-950 rounded-lg border border-solid border-stone-900">
              <h3 className="font-mono font-bold text-lg">
                Build Your Character
              </h3>
              <div>
                <div className="parameter parameter--text flex">
                  <ParameterAddon
                    title={'Name'}
                    description={'What should your character be called?'}
                  />
                  <Form.Item
                    className="mb-4 font-mono w-full"
                    name="name"
                    rules={[
                      {
                        required: true,
                        message: 'Please input a character name!',
                      },
                      {
                        min: 3,
                        max: 20,
                        message:
                          'Character name must be between 3 and 20 characters!',
                      },
                    ]}
                  >
                    <Input
                      className="with-addon"
                      spellCheck={false}
                      placeholder={EXAMPLE_CHARACTER.name}
                    />
                  </Form.Item>
                </div>
              </div>

              <div>
                <ParameterAddon
                  title={'Description'}
                  textArea={true}
                  description={
                    'Describe your character and shape its personality'
                  }
                />
                <Form.Item
                  className="mb-4 w-full"
                  name="description"
                  rules={[
                    { required: true, message: 'Please input a description!' },
                    {
                      min: 3,
                      max: 1000,
                      message:
                        'Description must be between 3 and 1000 characters!',
                    },
                  ]}
                >
                  <Input.TextArea
                    autoSize
                    placeholder={EXAMPLE_CHARACTER.description}
                    className="with-addon"
                  />
                </Form.Item>
              </div>

              <div>
                <ParameterAddon
                  title={'Portrait'}
                  description={
                    'Used as an avatar for your character. If mouth is visible, it will be animated when your character speaks. Portrait orientation recommended.'
                  }
                />
                <Form.Item className="mb-4 w-full" name="image">
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
              </div>

              <div className="flex max-w-full">
                <ParameterAddon
                  title={'Voice'}
                  info={'(optional)'}
                  description={
                    'Your character will speak with this voice. Voices provided by ElevenLabs.'
                  }
                />
                <Form.Item className="mb-4 w-full min-w-0" name="voice">
                  <Select className="with-addon">
                    {ELEVENLABS_VOICES.map(voice => (
                      <Select.Option key={voice.id} value={voice.id}>
                        {voice.name}, {voice.accent}, {voice.age},{' '}
                        {voice.gender}, {voice.description}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              <div>
                <ParameterAddon
                  title={'Greeting'}
                  textArea={true}
                  description={
                    'Your Character will introduce themselves with this message when entering a conversation'
                  }
                />
                <Form.Item
                  className="mb-4 font-mono w-full"
                  name="greeting"
                  rules={[
                    {
                      min: 3,
                      max: 1000,
                      message:
                        'Greeting must be between 3 and 1000 characters!',
                    },
                  ]}
                >
                  <Input.TextArea
                    className="with-addon"
                    autoSize
                    placeholder={EXAMPLE_CHARACTER.greeting}
                  />
                </Form.Item>
              </div>

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

              {proMode && (
                <>
                  <CharacterFormPro />
                  <Form.Item
                    label={
                      <FormLabel
                        text="Concept"
                        description="(Optional) Select a concept that your character will use when creating images."
                      />
                    }
                    className="label-auto-height"
                    labelCol={{ span: 24 }}
                    name="concept"
                  >
                    {concept && (
                      <div className="flex flex-col gap-2">{`Selected Concept: ${concept}`}</div>
                    )}
                    <ConceptSelectModalTrigger
                      onChange={concept => {
                        form.setFieldsValue({
                          ['concept']: concept ? concept._id : null,
                        })
                      }}
                    />
                  </Form.Item>
                </>
              )}

              <div className="flex flex-wrap gap-4 justify-between items-center">
                <Form.Item className="mb-0">
                  <Button
                    className="font-mono h-10"
                    htmlType="submit"
                    onClick={handleSubmit}
                  >
                    {mode === 'create' ? 'Create' : 'Update'} Character
                  </Button>
                </Form.Item>
                <div className="flex justify-between items-center">
                  <div>
                    <Switch checked={proMode} onChange={setProMode} />
                    <span className="mr-2">Pro Mode</span>
                  </div>
                  {user &&
                  user.featureFlags &&
                  user.featureFlags.includes('preview') ? (
                    <PrivacyToggle />
                  ) : null}
                </div>
                {character && <CharacterToolButtons character={character} />}
              </div>
            </div>

            <div>
              <div className="sticky top-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg mb-4">
                <h3 className="font-mono font-bold text-lg">
                  Test Your Character
                </h3>
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
                  <Form.Item className="mb-0">
                    <Button
                      className="font-mono"
                      onClick={generateCompletion}
                      loading={completing}
                    >
                      Generate Response
                    </Button>
                  </Form.Item>

                  <div
                    className={`border border-solid border-gray-700 bg-gray-200 dark:bg-stone-900 rounded-md p-4 gap-2 mt-4 flex`}
                  >
                    <div>
                      <div className="flex gap-2 items-center">
                        <div
                          title="Character Generated Response"
                          className="flex items-center justify-center cursor-pointer w-16 h-16"
                        >
                          {characterImageFieldValue &&
                          typeof characterImageFieldValue === 'string' ? (
                            <Image
                              src={characterImageFieldValue}
                              width={64}
                              height={64}
                              alt="character-avatar"
                              className="object-cover rounded-full"
                            />
                          ) : (
                            <RobotOutlined className="text-6xl text-gray-600" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-full">
                      <div>{characterName}</div>
                      {!completing && !usedCompletion ? (
                        <div className="text-xs text-gray-500 mt-1">...zZZ</div>
                      ) : null}
                      {completing ? (
                        <div className="w-fit mt-1 bg-gray-600 h-8 items-center rounded-md rounded-tl-none text-center font-black px-2 flex gap-0.5">
                          <span
                            className="animate-bounce"
                            style={{
                              animationDelay: '0ms',
                              animationDuration: '750ms',
                            }}
                          >
                            .
                          </span>
                          <span
                            className="animate-bounce"
                            style={{
                              animationDelay: '125ms',
                              animationDuration: '750ms',
                            }}
                          >
                            .
                          </span>
                          <span
                            className="animate-bounce"
                            style={{
                              animationDelay: '250ms',
                              animationDuration: '750ms',
                            }}
                          >
                            .
                          </span>
                        </div>
                      ) : null}
                      <Form.Item
                        labelCol={{ span: 24 }}
                        name="completion"
                        className={`mb-1 w-full ${
                          !completing && usedCompletion ? '' : 'hidden'
                        }`}
                      >
                        <Input.TextArea
                          className="w-fullborder-none mt-1 bg-blue-200 dark:!bg-indigo-900 !border-none !rounded-lg !rounded-tl-none"
                          readOnly
                          autoSize
                          disabled={completing}
                        />
                      </Form.Item>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Form>
      </div>
    </ConfirmProvider>
  )
}

export default CharacterForm
