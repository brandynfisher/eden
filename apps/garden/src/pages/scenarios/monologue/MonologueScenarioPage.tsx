import MannaCostEstimate from '@/components/Creation/CreationInterface/MannaCostEstimate'
import ResultPreview from '@/components/Creation/CreationInterface/ResultPreview'
import FormLabel from '@/components/Forms/FormLabel'
import { useMyCharacters } from '@/hooks/useMyCharacters'
import { requireAuth } from '@/lib/auth'
import { handleAxiosError } from '@/lib/fetcher'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { UserContext } from '@/providers/UserProvider'
import { ExperimentOutlined } from '@ant-design/icons'
import { Character } from '@edenlabs/eden-sdk'
import { useViewportSize } from '@mantine/hooks'
import { debounce } from '@mui/material'
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

const MonologueScenarioPageContent = ({
  characters,
}: {
  characters: Character[]
}) => {
  const resultPreviewRef = useRef<HTMLDivElement>(null)
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const {
    taskIds,
    setTaskIds,
    setActiveTaskId,
    setHasChangedGenerator,
    refetchPendingTasks,
  } = useContext(CreationNotificationContext)
  const { refetch, mannaBalance, isAuthenticated, authenticate } =
    useContext(UserContext)
  const [isFormTouched, setIsFormTouched] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeCharacter, setActiveCharacter] = useState<Character>(
    characters?.[0] as Character,
  )
  const [activeCharacterName, setActiveCharacterName] = useState<string>(
    activeCharacter && activeCharacter.name,
  )
  const [canAffordOperation, setCanAffordOperation] = useState(false)
  const [taskCost, setTaskCost] = useState<{ cost: number } | undefined>()
  const [isLoadingTaskCost, setIsLoadingTaskCost] = useState<boolean | null>(
    null,
  )
  const { width } = useViewportSize()

  useEffect(() => {
    if (taskCost && mannaBalance) {
      setCanAffordOperation(mannaBalance >= taskCost?.cost)
    } else {
      setCanAffordOperation(true)
    }
  }, [taskCost, mannaBalance])

  const handleActiveCharacterChange = (characterName: string) => {
    const character = characters?.find(
      character => character.name === characterName,
    )
    setActiveCharacter(character as Character)
    setActiveCharacterName(character?.name as string)
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
      characterId: activeCharacter.id,
      prompt: form.getFieldValue('prompt'),
    }
    try {
      const response = await axios.post('/api/tasks/create', {
        generatorName: 'monologue',
        config: config,
      })

      message.destroy()

      if (!response || !response.data) {
        message.error(`Monologue task response error`)
        return
      }

      const { taskId } = response.data

      message.success(`Monologue Task created! (${taskId})`)

      setActiveTaskId && setActiveTaskId(taskId)
      setTaskIds && setTaskIds([...taskIds, taskId])
      setHasChangedGenerator && setHasChangedGenerator(false)
      refetchPendingTasks && refetchPendingTasks()
      refetch.mannaBalance()
      onSubmitSuccess()
    } catch (error) {
      handleAxiosError(error, message, 'Error requesting monologue generation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const debouncedHandleFormFieldsChange = useMemo(
    () =>
      debounce(() => {
        setIsFormTouched(true)
        handleGetTaskCost()
      }, 500),
    [],
  )

  const handleGetTaskCost = useCallback(async () => {
    setIsLoadingTaskCost(true)

    if (!isAuthenticated) {
      await requireAuth(authenticate)

      setIsLoadingTaskCost(false)
      return
    }

    try {
      message.destroy()

      const response = await axios.post('/api/tasks/cost', {
        generatorName: 'monologue',
        config: { prompt: 'dummy prompt' },
      })

      setTaskCost(response.data)
    } catch (err) {
      console.error(err)
      message.error('Error fetching task cost estimate')
    } finally {
      setIsLoadingTaskCost(false)
    }
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <h2 className="mb-4">Scenario: Monologue</h2>
        <div>
          <label htmlFor="character-select">Selected Character:</label>
          <div className="w-full flex flex-col mt-2 mb-4">
            <Select
              id="character-select"
              value={activeCharacterName}
              onChange={handleActiveCharacterChange}
            >
              {characters &&
                characters.length &&
                characters.map(character => (
                  <Select.Option key={character.id} value={character.name}>
                    {character.name}
                  </Select.Option>
                ))}
            </Select>
          </div>

          {activeCharacter ? (
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
                    <h3>Generate Monologue</h3>
                    <span style={{ color: 'gray' }}>
                      Uses a character to generate an animated monologue in
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
                      {isLoadingTaskCost === false && !canAffordOperation ? (
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
                        cost={taskCost?.cost || 'n/a'}
                      />
                    </div>
                  </div>,
                ]}
              >
                <Form.Item
                  label={
                    <FormLabel
                      text="Prompt"
                      description="Message that your character should respond to"
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
                      message: 'Prompt must be between 1 and 1000 characters!',
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
        {activeCharacter ? (
          <ResultPreview innerRef={resultPreviewRef} />
        ) : (
          <div>Choose a character to proceed</div>
        )}
      </div>
    </div>
  )
}

const MonologueScenarioPage = ({ data }: { data: Character[] }) => {
  const { isAuthenticated, userId } = useContext(UserContext)
  const { characters: charactersData } = useMyCharacters({
    userId,
    isAuthenticated,
    options: {
      fallbackData: data,
    },
  })

  if (!data) {
    return null
  }

  return <MonologueScenarioPageContent characters={charactersData || data} />
}

export default MonologueScenarioPage
