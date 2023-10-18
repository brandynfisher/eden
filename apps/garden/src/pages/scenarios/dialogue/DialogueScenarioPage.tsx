import MannaCostEstimate from '@/components/Creation/CreationInterface/MannaCostEstimate'
import ResultPreview from '@/components/Creation/CreationInterface/ResultPreview'
import FormLabel from '@/components/Forms/FormLabel'
import { useCharacters } from '@/hooks/useCharacters'
import { useTaskCost } from '@/hooks/useTaskCost'
import { handleAxiosError } from '@/lib/fetcher'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { UserContext } from '@/providers/UserProvider'
import ExperimentOutlined from '@ant-design/icons/ExperimentOutlined'
import { Character } from '@edenlabs/eden-sdk'
import { useViewportSize } from '@mantine/hooks'
import { debounce } from '@mui/material/utils'
import { App, Button, Card, Form, Input, Select } from 'antd'
import axios from 'axios'
import Link from 'next/link'
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const DialogueScenarioPageContent = ({
  characters,
}: {
  characters: Character[]
}) => {
  const MAX_ACTIVE_CHARACTERS = 2

  const resultPreviewRef = useRef<HTMLDivElement>(null)
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const { taskIds, setTaskIds, setActiveTaskId, setHasChangedGenerator } =
    useContext(CreationNotificationContext)
  const { mannaBalance, refetchMe, user } = useContext(UserContext)
  const { getTaskCost, canAffordOperation, isLoadingTaskCost, taskCost } =
    useTaskCost()
  const [isFormTouched, setIsFormTouched] = useState(false)
  const [isRequirementsMet, setIsRequirementsMet] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeCharacters, setActiveCharacters] = useState<Character[]>([
    ...Array(MAX_ACTIVE_CHARACTERS),
  ])
  const { width } = useViewportSize()

  const handleActiveCharacterChange = (
    index: number,
    characterName: string,
  ) => {
    const character = characters?.find(
      character => character.name === characterName,
    )

    if (!character) return

    const currentlyActive = activeCharacters
    currentlyActive[index] = character

    setActiveCharacters([...currentlyActive])
  }

  const scrollResultPreviewIntoView = useCallback(() => {
    if (width > 1024) {
      return
    }

    if (resultPreviewRef && resultPreviewRef.current) {
      resultPreviewRef.current.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      })
    }
  }, [resultPreviewRef, width])

  const onSubmitSuccess = () => {
    scrollResultPreviewIntoView()
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const config = {
      characterIds: activeCharacters.map(activeChar => activeChar.id),
      prompt: form.getFieldValue('prompt'),
    }
    try {
      const response = await axios.post('/api/tasks/create', {
        generatorName: 'dialogue',
        config: config,
      })

      message.destroy()

      if (!response || !response.data) {
        message.error(`Dialogue task response error`)
        return
      }

      const { taskId } = response.data

      message.success(`Dialogue Task created! (${taskId})`)

      setActiveTaskId && setActiveTaskId(taskId)
      setTaskIds && setTaskIds([...taskIds, taskId])
      setHasChangedGenerator && setHasChangedGenerator(false)
      refetchMe()
      onSubmitSuccess()
    } catch (error) {
      handleAxiosError(error, message, 'Error requesting dialogue generation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const debouncedHandleFormFieldsChange = useMemo(
    () =>
      debounce(async () => {
        setIsFormTouched(true)
        await getTaskCost('dialogue', {
          characterIds: ['1', '2'],
          prompt: 'dummy prompt',
        })
      }, 500),
    [],
  )

  useEffect(() => {
    setIsRequirementsMet(
      !activeCharacters.some(char => {
        return !char
      }),
    )
  }, [activeCharacters])

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h2 className="mb-4">Scenario: Dialogue</h2>
          <div>
            <label htmlFor="character-select">
              Select {MAX_ACTIVE_CHARACTERS} characters:
            </label>
            <div className="w-full flex flex-col mt-2 mb-4 gap-2">
              {activeCharacters.map((activeCharacter, index) => (
                <Select
                  key={`${
                    activeCharacter ? activeCharacter.name : ''
                  }_${index}`}
                  id="character-select"
                  value={activeCharacter ? activeCharacter.name : null}
                  onChange={newValue =>
                    handleActiveCharacterChange(index, newValue)
                  }
                >
                  {characters &&
                    characters.length &&
                    characters.map(character => (
                      <Select.Option key={character.id} value={character.name}>
                        {character.name}
                      </Select.Option>
                    ))}
                </Select>
              ))}
            </div>

            {isRequirementsMet ? (
              <Form
                form={form}
                name="CharacterForm"
                onFinish={handleSubmit}
                onFieldsChange={debouncedHandleFormFieldsChange}
                scrollToFirstError={true}
              >
                <Card
                  type="inner"
                  title={
                    <div className="py-4">
                      <h3>Generate Dialogue</h3>
                      <span style={{ color: 'gray' }}>
                        Uses two characters to generate an animated dialogue in
                        response to a prompt
                      </span>
                    </div>
                  }
                  actions={[
                    <div
                      key={1}
                      className="flex px-6 items-center justify-between flex-wrap"
                    >
                      <div className="flex gap-3 items-center">
                        {user &&
                        isLoadingTaskCost === false &&
                        typeof mannaBalance !== 'undefined' &&
                        !canAffordOperation ? (
                          <div className="text-orange-500">
                            Insufficient Manna! ({mannaBalance}){' '}
                            <Link href="/manna">Click here to get more</Link>
                          </div>
                        ) : (
                          <Button
                            type="primary"
                            icon={<ExperimentOutlined />}
                            htmlType="submit"
                            size="large"
                            className="font-mono capitalize"
                            loading={isSubmitting ? { delay: 250 } : false}
                            disabled={
                              isSubmitting ||
                              !isFormTouched ||
                              !canAffordOperation
                            }
                          >
                            Submit
                          </Button>
                        )}
                        <MannaCostEstimate
                          isLoading={!!isLoadingTaskCost}
                          cost={taskCost || 'n/a'}
                        />
                      </div>
                    </div>,
                  ]}
                >
                  <Form.Item
                    label={
                      <FormLabel
                        text="Prompt"
                        description="Prompt which your characters should talk about"
                      />
                    }
                    className="label-auto-height"
                    labelCol={{ span: 24 }}
                    name="prompt"
                    rules={[
                      { required: true, message: 'Please input a prompt!' },
                      {
                        min: 1,
                        max: 1000,
                        message:
                          'Prompt must be between 1 and 1000 characters!',
                      },
                    ]}
                  >
                    <Input.TextArea autoSize />
                  </Form.Item>
                </Card>
              </Form>
            ) : null}
          </div>
        </div>
        <div>
          {isRequirementsMet ? (
            <ResultPreview innerRef={resultPreviewRef} />
          ) : (
            <div>Choose characters to proceed</div>
          )}
        </div>
      </div>
    </>
  )
}

const DialogueScenarioPage = ({ data }: { data: Character[] }) => {
  const { isAuthenticated } = useContext(UserContext)
  const { characters: charactersData } = useCharacters({
    isAuthenticated,
    options: {
      fallbackData: data,
    },
  })

  if (!data) {
    return null
  }

  return <DialogueScenarioPageContent characters={charactersData || data} />
}

export default DialogueScenarioPage
