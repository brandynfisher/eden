import MannaCostEstimate from '@/components/Creation/CreationInterface/MannaCostEstimate'
import FormLabel from '@/components/Forms/FormLabel'
import { useMyCharacters } from '@/hooks/useMyCharacters'
import { requireAuth } from '@/lib/auth'
import { handleAxiosError } from '@/lib/fetcher'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { UserContext } from '@/providers/UserProvider'
import { ExperimentOutlined } from '@ant-design/icons'
import { Character } from '@edenlabs/eden-sdk'
import { debounce } from '@mui/material'
import { App, Button, Card, Form, Input, Select } from 'antd'
import axios from 'axios'
import Link from 'next/link'
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const TalkingHeadScenarioPageContent = ({
  characters,
}: {
  characters: Character[]
}) => {
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
  const [isLoadingTaskCost, setIsLoadingTaskCost] = useState(false)

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
        message.error(`Talking Head task response error`)
        return
      }

      const { taskId } = response.data

      message.success(`Talking Head Task created! (${taskId})`)

      setActiveTaskId && setActiveTaskId(taskId)
      setTaskIds && setTaskIds([...taskIds, taskId])
      setHasChangedGenerator && setHasChangedGenerator(false)
      refetchPendingTasks && refetchPendingTasks()
      refetch.mannaBalance()
    } catch (error) {
      handleAxiosError(
        error,
        message,
        'Error requesting talking head generation',
      )
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
    <div className="flex flex-col h-full">
      <h2 className="mb-4">Scenario: Talking Head</h2>
      <label htmlFor="character-select">Selected Character:</label>
      <div className="w-full flex flex-col space-y-4 mt-2 mb-4">
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
                <h3>Create Talking Head</h3>
                <span style={{ color: 'gray' }}>description</span>
              </div>
            }
            actions={[
              <div
                key={1}
                className="flex px-6 items-center justify-between flex-wrap"
              >
                <div className="flex gap-3 items-center">
                  {!canAffordOperation ? (
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
                        isSubmitting || !isFormTouched || !canAffordOperation
                      }
                    >
                      Submit
                    </Button>
                  )}
                  <MannaCostEstimate
                    isLoading={isLoadingTaskCost}
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
      ) : (
        <div>Choose a character to proceed</div>
      )}
      <div>{JSON.stringify(activeCharacter, null, 2)}</div>
    </div>
  )
}

const TalkingHeadScenarioPage = ({ data }: { data: Character[] }) => {
  const { isAuthenticated, address } = useContext(UserContext)
  const { characters: charactersData } = useMyCharacters({
    userId: address ? address : null,
    isAuthenticated,
    options: {
      fallbackData: data,
    },
  })

  if (!data) {
    return null
  }

  return <TalkingHeadScenarioPageContent characters={charactersData || data} />
}

export default TalkingHeadScenarioPage
