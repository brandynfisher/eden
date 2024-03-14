import ChatCapabilityMessageSection from '@/components/Characters/ChatMessageSection'
import {
  ELEVENLABS_VOICES,
  ElevenLabsVoice,
} from '@/components/Characters/elevenlabs'
import SelectConceptModalTrigger from '@/components/Creation/CreationInterface/SelectConceptModalTrigger'
import { ConceptParameterUI } from '@/components/Creation/CreationInterface/parameters/ConceptParameter'
import ParameterAddon from '@/components/Creation/CreationInterface/parameters/ParameterAddon'
import UploadParameter from '@/components/Creation/CreationInterface/parameters/UploadParameter'
import FormLabel from '@/components/Forms/FormLabel'
import PrivacyToggle from '@/components/Forms/PrivacyToggle'
import { handleAxiosError } from '@/lib/fetcher'
import { ChatMessageGroup } from '@/lib/types'
import RobotOutlined from '@ant-design/icons/RobotOutlined'
import { Character, CharactersTestArguments } from '@edenlabs/eden-sdk'
import { ChatModel } from '@edenlabs/eden-sdk'
import { SettingsSuggest } from '@mui/icons-material'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import {
  App,
  Button,
  Collapse,
  Form,
  FormInstance,
  Input,
  Select,
  Switch,
  Tag,
} from 'antd'
import axios from 'axios'
import { ConfirmProvider, useConfirm } from 'material-ui-confirm'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'

const { Panel } = Collapse
const EXAMPLE_CHARACTER = {
  name: 'Abraham',
  identity:
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
  identity: string
  greeting: string
  completion: string
  creationsEnabled: boolean
  knowledgeEnabled: boolean
  smartReplyEnabled: boolean
  storyCreationEnabled: boolean
  concept?: string
  knowledge?: string
  knowledgeSummary?: string
  chatModel: string
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
      .catch(() => {})
  }

  const handleDeleteCharacter = async () => {
    try {
      await axios.post(`/api/characters/delete`, {
        characterId: character._id,
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

const CreationsSection = ({
  form,
  concept,
}: {
  form: FormInstance
  concept: string
}) => {
  const creationEnabled = Form.useWatch('creationsEnabled', form)

  return (
    <div className="px-2 py-2">
      <div className="flex justify-between items-center">
        <FormLabel
          text="Enable Creations"
          description="Turn on to enable creations for this character."
        />
        <Form.Item
          name="creationsEnabled"
          valuePropName="checked"
          style={{ marginBottom: 0 }}
        >
          <Switch />
        </Form.Item>
      </div>
      {creationEnabled && (
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
          <div>
            <div className="mb-2">
              <SelectConceptModalTrigger
                onChange={concept => {
                  form.setFieldsValue({
                    ['concept']: concept ? concept._id : null,
                  })
                }}
              />
            </div>
            {concept && (
              <ConceptParameterUI
                conceptId={concept}
                onChange={() => form.setFieldValue('concept', null)}
              />
            )}
          </div>
        </Form.Item>
      )}
    </div>
  )
}

const KnowledgeSection = ({ form }: { form: FormInstance }) => {
  const knowledgeEnabled = Form.useWatch('knowledgeEnabled', form)

  return (
    <div className="px-2 py-2">
      <div className="flex justify-between items-center">
        <FormLabel
          text="Enable Knowledge"
          description="Turn on to enable knowledge for this character. Knowledge enables a character to have a set of information to selectively from. It can be used for things like answering questions about documentation."
        />
        <Form.Item
          name="knowledgeEnabled"
          valuePropName="checked"
          style={{ marginBottom: 0 }}
        >
          <Switch />
        </Form.Item>
      </div>

      {knowledgeEnabled && (
        <>
          <Form.Item
            label={
              <FormLabel
                text="Knowledge"
                description="Add knowledge for your character"
              />
            }
            className="label-auto-height !mb-2"
            labelCol={{ span: 24 }}
            name="knowledge"
          >
            <Input.TextArea autoSize={{ minRows: 3 }} />
          </Form.Item>

          <Form.Item
            label={
              <FormLabel
                text="Knowledge Summary"
                description="(Optional) Add a knowledge summary for your character. This should be a few sentences that will clue your character as to when it should use its full knowledge. If you do not provide a summary, it will be auto-generated on save."
              />
            }
            className="label-auto-height !mb-0"
            labelCol={{ span: 24 }}
            name="knowledgeSummary"
          >
            <Input.TextArea autoSize={{ minRows: 3 }} />
          </Form.Item>
        </>
      )}
    </div>
  )
}

// const SmartReplySection = () => {
//   return (
//     <div className="px-2 py-2">
//       <div className="flex justify-between items-center">
//         <FormLabel
//           text="Enable Smart Reply"
//           description="Turn on to enable smart reply for this character. Smart reply lets a character decide when to respond based on the conversation."
//         />
//         <Form.Item
//           name="smartReplyEnabled"
//           valuePropName="checked"
//           style={{ marginBottom: 0 }}
//         >
//           <Switch />
//         </Form.Item>
//       </div>
//     </div>
//   )
// }

const StoryCreationSection = () => {
  return (
    <div className="px-2 py-2">
      <div className="flex justify-between items-center">
        <FormLabel
          text="Enable Story Creation"
          description="Turn on to enable story creation for this character. Story creation lets a character iteratively draft a story based on the conversation."
        />
        <Form.Item
          name="storyCreationEnabled"
          valuePropName="checked"
          style={{ marginBottom: 0 }}
        >
          <Switch />
        </Form.Item>
      </div>
    </div>
  )
}

const ChatModelSection = ({ form }: { form: FormInstance }) => {
  const selectedChatModel = Form.useWatch('chatModel', form)

  return (
    <div className="px-2 py-2">
      <Form.Item
        name="chatModel"
        className="w-full" // Use Tailwind CSS to ensure the Form.Item takes the full width
      >
        <FormLabel
          text="Chat Model"
          description="Select a custom chat model for your character."
        />
        <Select
          showSearch
          placeholder="Select a chat model"
          className="w-full mt-2" // Use Tailwind CSS for full width and margin top
          value={selectedChatModel}
          onChange={value => {
            form.setFieldsValue({ chatModel: value })
          }}
        >
          {Object.values(ChatModel).map(model => (
            <Select.Option key={model} value={model} className="w-full">
              {model}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </div>
  )
}

const CharacterForm = ({ character }: { character?: Character }) => {
  const mode = !character ? 'create' : 'update'
  const { message } = App.useApp()
  const router = useRouter()
  const [form] = Form.useForm()
  const [recentMessage, setRecentMessage] =
    useState<ChatMessageGroup[]>(exampleRecentMessage)
  const [messageGroups, setMessageGroups] = useState<ChatMessageGroup[]>([])
  const [completing, setCompleting] = useState<boolean>(false)
  const [usedCompletion, setUsedCompletion] = useState<boolean>(false)

  const characterName = Form.useWatch('name', form)
  const identity = Form.useWatch('identity', form)
  const concept = Form.useWatch('concept', form)
  const voice = Form.useWatch('voice', form)
  const characterImageFieldValue = Form.useWatch('image', form) as {} | string

  const [selectedVoiceObj, setSelectedVoiceObj] = useState<ElevenLabsVoice>()

  const updateSelectedVoiceObj = (voiceId: string | undefined) => {
    setSelectedVoiceObj(
      typeof voiceId !== 'undefined'
        ? ELEVENLABS_VOICES.filter(labsVoice => labsVoice.id === voiceId)[0]
        : undefined,
    )
  }

  useEffect(() => {
    updateSelectedVoiceObj(voice)
  }, [voice])

  useEffect(() => {
    const formValues: CharacterFormInput =
      mode === 'update' && character
        ? {
            name: character?.name,
            identity: character?.logosData?.identity || '',
            greeting: character?.greeting || '',
            completion: '',
            image: character?.image || '',
            voice: character?.voice || '',
            concept: character?.logosData?.concept || '',
            knowledge: character?.logosData?.knowledge || '',
            knowledgeSummary: character?.logosData?.knowledgeSummary || '',
            creationsEnabled:
              character?.logosData?.abilities?.creations || false,
            knowledgeEnabled:
              character?.logosData?.abilities?.knowledge || false,
            smartReplyEnabled:
              character?.logosData?.abilities?.smart_reply || false,
            storyCreationEnabled:
              character?.logosData?.abilities?.story_creations || false,
            chatModel: character?.logosData?.chatModel || 'gpt-3.5-turbo',
            isPrivate: character?.isPrivate || false,
          }
        : {
            name: '',
            identity: '',
            greeting: '',
            completion: '',
            image: '',
            voice: '',
            concept: '',
            knowledge: '',
            knowledgeSummary: '',
            creationsEnabled: false,
            knowledgeEnabled: false,
            smartReplyEnabled: false,
            storyCreationEnabled: false,
            chatModel: 'gpt-3.5-turbo',
            isPrivate: false,
          }

    form.setFieldsValue(formValues)

    const characterDialogue = character?.dialogue
      ? (coupledArray(character.dialogue) as ChatMessageGroup[])
      : []

    setMessageGroups(mode === 'create' ? [] : characterDialogue)
  }, [form, mode, character])

  const handleTestCharacter = async () => {
    setUsedCompletion(true)
    setCompleting(true)
    try {
      const url = `/api/characters/test`
      const data: CharactersTestArguments = {
        name: characterName,
        identity,
        message: recentMessage[0][0].message,
        knowledge: form.getFieldValue('knowledge'),
        knowledge_summary: form.getFieldValue('knowledgeSummary'),
      }
      const response = await axios.post(url, data)
      const completion = response.data.message as string
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
    const identity = form.getFieldValue('identity')
    const concept = form.getFieldValue('concept')
    const knowledge = form.getFieldValue('knowledge')
    const knowledgeSummary = form.getFieldValue('knowledgeSummary')
    const data = {
      name: characterName,
      greeting: form.getFieldValue('greeting'),
      image: form.getFieldValue('image'),
      voice: form.getFieldValue('voice'),
      dialogue: messageGroups.flat(),
      logosData: {
        abilities: {
          creations: form.getFieldValue('creationsEnabled'),
          knowledge: form.getFieldValue('knowledgeEnabled'),
          smart_reply: form.getFieldValue('smartReplyEnabled'),
          story_creations: form.getFieldValue('storyCreationEnabled'),
        },
        identity: identity ? identity : null,
        concept: concept ? concept : null,
        knowledge: knowledge ? knowledge : null,
        knowledgeSummary: knowledgeSummary ? knowledgeSummary : null,
        chatModel: form.getFieldValue('chatModel'),
      },
      isPrivate: form.getFieldValue('isPrivate'),
    }

    try {
      if (mode === 'create') {
        await axios.post(`/api/characters/create`, data)
      } else {
        await axios.patch(`/api/characters/${character?._id}`, {
          ...data,
          characterId: character?._id,
        })
      }

      message.destroy()
      message.success(`Character '${data.name}' ${mode}d`)
      await router.push(`/create/characters`)
    } catch (error) {
      handleAxiosError(error, message, 'Error creating/updating character')
    }
  }

  const handlePlayVoiceSample = useCallback((url: string) => {
    const audioElement = document.createElement('audio')
    audioElement.autoplay = true
    audioElement.controls = false
    audioElement.src = url
  }, [])

  return (
    <ConfirmProvider>
      <div className="mb-4">
        <Form form={form} name="CharacterForm">
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 ">
            <div className="py-2 bg-gray-100 dark:bg-gray-900 rounded-lg border border-solid border-stone-800">
              <div className="px-2">
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
                    title={'Identity'}
                    textArea={true}
                    description={
                      'Describe your character and shape its identity'
                    }
                  />
                  <Form.Item
                    className="mb-4 w-full"
                    name="identity"
                    rules={[
                      { required: true, message: 'Please input an identity!' },
                      {
                        min: 3,
                        max: 9999,
                        message:
                          'Identity must be between 3 and 9999 characters!',
                      },
                    ]}
                  >
                    <Input.TextArea
                      autoSize
                      placeholder={EXAMPLE_CHARACTER.identity}
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

                <div className="mb-4 w-full">
                  <div className="flex w-full">
                    <ParameterAddon
                      title={'Voice'}
                      info={'(optional)'}
                      description={
                        'Your character will speak with this voice. Voices provided by ElevenLabs.'
                      }
                    />
                    <Form.Item className="mb-0 w-full min-w-0" name="voice">
                      <Select
                        className="with-addon"
                        showSearch
                        placeholder="Search to Select"
                        optionFilterProp="children"
                        options={ELEVENLABS_VOICES.map(labVoice => ({
                          value: labVoice.id,
                          label: `${labVoice.name}, ${labVoice.accent}, ${
                            labVoice.age
                          }, ${labVoice.gender}${
                            labVoice.description
                              ? `, ${labVoice.description}`
                              : ''
                          }${
                            labVoice.use_case ? `, ${labVoice.use_case}` : ''
                          }`,
                        }))}
                        onSelect={val => updateSelectedVoiceObj(val)}
                        filterOption={(input, option) =>
                          (option?.label ?? '').includes(input)
                        }
                        filterSort={(optionA, optionB) =>
                          (optionA?.label ?? '')
                            .toLowerCase()
                            .localeCompare((optionB?.label ?? '').toLowerCase())
                        }
                      />
                    </Form.Item>
                  </div>
                  {selectedVoiceObj ? (
                    <div className="flex mt-1">
                      <Tag
                        className={`flex items-center first-letter:capitalize me-0 gap-1 !pl-0 !pr-2 hover:text-blue-400`}
                        // bordered={false}
                        icon={<PlayArrowRounded fontSize="medium" />}
                        onClick={() =>
                          handlePlayVoiceSample(selectedVoiceObj.preview_url)
                        }
                      >
                        Test Sample <strong>{selectedVoiceObj.name}</strong>
                      </Tag>
                    </div>
                  ) : null}
                </div>

                <div className="hidden">
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
              </div>

              <Collapse
                expandIconPosition="end"
                className="mb-4 generator-settings-collapse"
              >
                <Panel
                  key={'advanced'}
                  header={
                    <div className="flex gap-2 items-center">
                      <SettingsSuggest fontSize="small" />
                      <span>Advanced Settings</span>
                    </div>
                  }
                  forceRender={true}
                >
                  <div className="px-2 py-2">
                    <CreationsSection form={form} concept={concept} />
                    <KnowledgeSection form={form} />
                    {/*<SmartReplySection />*/}
                    <StoryCreationSection />
                    <ChatModelSection form={form} />
                  </div>
                </Panel>
              </Collapse>

              <div className="flex flex-wrap gap-4 justify-between items-center px-2">
                <div className="flex justify-between items-center w-full">
                  <PrivacyToggle />
                </div>
                <Form.Item className="mb-0">
                  <Button
                    className="font-mono h-10"
                    htmlType="submit"
                    onClick={handleSubmit}
                  >
                    {mode === 'create' ? 'Create' : 'Update'} Character
                  </Button>
                </Form.Item>
                {character && <CharacterToolButtons character={character} />}
              </div>
            </div>

            <div>
              <div className="sticky top-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 border border-solid border-stone-800">
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
                      onClick={handleTestCharacter}
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
