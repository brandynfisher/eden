import OptionParameter from '@/components/Creation/CreationInterface/parameters/OptionParameter'
import SliderParameter from '@/components/Creation/CreationInterface/parameters/SliderParameter'
import StringParameter from '@/components/Creation/CreationInterface/parameters/StringParameter'
import UploadParameter from '@/components/Creation/CreationInterface/parameters/UploadParameter'
import { requireAuth } from '@/lib/auth'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { UserContext } from '@/providers/UserProvider'
import {
  DownCircleOutlined,
  ExperimentOutlined,
  UpCircleOutlined,
} from '@ant-design/icons'
import {
  Creation,
  Generator,
  GeneratorParameter,
  Task,
} from '@edenlabs/eden-sdk'
import { App, Button, Card, Form } from 'antd'
import axios from 'axios'
import { useRouter } from 'next/router'
import React, { useCallback, useContext, useEffect, useState } from 'react'

type FieldValues = { [key: string]: string }

const GeneratorForm = ({
  generator,
  presetCreation,
}: {
  generator: Generator
  presetCreation?: Creation
}) => {
  const {
    taskIds,
    setTaskIds,
    setActiveTaskId,
    setHasChangedGenerator,
    refetchPendingTasks,
  } = useContext(CreationNotificationContext)
  const { message } = App.useApp()
  const router = useRouter()
  const { refetch, isAuthenticated, authenticate } = useContext(UserContext)
  const [form] = Form.useForm()
  const [presetConfig, setPresetConfig] = useState<Task['config']>()
  const [initialParams, setInitialParams] = useState<GeneratorParameter[]>([])
  const [requiredParameters, setRequiredParams] = useState<
    GeneratorParameter[]
  >([])
  const [optionalParameters, setOptionalParams] = useState<
    GeneratorParameter[]
  >([])

  useEffect(() => {
    const transformConfig = () => {
      if (!presetCreation) {
        return
      }

      // if is "recreate": add fields to pre-populate media/image upload fields by uri
      if (router.query.generator && router.query.generator === 'remix') {
        setPresetConfig({
          ...presetCreation.task.config,
          init_image_strength: 0.3,
          init_image_data: presetCreation.uri,
          seed: '',
        })
        return
      }
      // else assume preset mode
      // transform config in whatever way
      setPresetConfig(presetCreation.task.config)
    }

    transformConfig()
  }, [presetCreation])

  const getCurrentGeneratorParameters = (currentGenerator: Generator) => {
    if (!currentGenerator) return

    const selectedVersion = currentGenerator.versions[0]

    if (!selectedVersion) return

    const { parameters } = selectedVersion

    if (!parameters.length) return

    return [
      ...parameters.map(param => ({
        ...param,
        default: param.default === null ? '' : param.default,
      })),
    ]
  }

  useEffect(() => {
    const currentGeneratorParams = getCurrentGeneratorParameters(generator)

    if (currentGeneratorParams) {
      setInitialParams(currentGeneratorParams)
    }
  }, [generator])

  useEffect(() => {
    setRequiredParams(initialParams.filter(parameter => parameter.isRequired))
    setOptionalParams(initialParams.filter(parameter => !parameter.isRequired))
  }, [initialParams])

  const [showOptional, setShowOptional] = React.useState(false)
  const [stringArrayValues, setStringArrayValues] = useState({})

  const onStringArrayChange = (parameterName: string, newValues: string[]) => {
    const newStringArrayValues = { ...stringArrayValues }
    //@ts-ignore
    newStringArrayValues[parameterName] = newValues
    setStringArrayValues(newStringArrayValues)
  }

  const handleFinish = async () => {
    if (!isAuthenticated) {
      await requireAuth(authenticate)
      return
    }

    message.destroy()

    try {
      const formFieldValues = form.getFieldsValue()
      const consolidatedFieldValues: FieldValues = {
        ...formFieldValues,
        ...stringArrayValues,
      }

      // filter out temporary preset form values
      const cleanedValues = Object.keys(consolidatedFieldValues)
        .filter(key => !key.endsWith('--preset'))
        .reduce((obj: FieldValues, key) => {
          obj[key] = consolidatedFieldValues[key]
          return obj
        }, {})

      const response = await axios.post('/api/tasks/create', {
        generatorName: generator.generatorName,
        config: cleanedValues,
      })

      message.success('Task created!')

      const { taskId } = response.data
      setActiveTaskId && setActiveTaskId(taskId)
      setTaskIds && setTaskIds([...taskIds, taskId])
      setHasChangedGenerator && setHasChangedGenerator(false)
      refetchPendingTasks && refetchPendingTasks()
      refetch.mannaBalance()
    } catch (error) {
      message.error('Error creating task. Please try again.')
    }
  }

  const resetForm = () => {
    form.resetFields()
    setHasChangedGenerator && setHasChangedGenerator(true)
    // reset form
    setStringArrayValues({})
    setPresetConfig({})
  }

  const renderFormFields = useCallback(
    (parameters: GeneratorParameter[], isOptional: boolean) => {
      return parameters.map(parameter => {
        if (presetConfig) {
          const presetParameter = Object.entries(presetConfig).filter(
            ([key]) => key === parameter.name,
          )[0]

          if (presetParameter) {
            parameter.default = presetParameter[1]
          }
        }

        if (!presetCreation && isOptional && !showOptional) {
          return
        }

        return (
          <div
            key={parameter.name}
            className={`bg-gray-100 dark:bg-gray-900 p-4 rounded-md mb-6 ${
              !showOptional && isOptional ? 'hidden' : ''
            }`}
          >
            {(parameter.allowedValues && parameter.allowedValues.length > 0) ||
            parameter.allowedValuesFrom ? (
              <OptionParameter
                key={parameter.name}
                form={form}
                parameter={parameter}
              />
            ) : (
              <>
                {typeof parameter.default === 'number' ? (
                  <SliderParameter
                    key={parameter.name}
                    form={form}
                    parameter={parameter}
                  />
                ) : (
                  <>
                    {parameter.mediaUpload ? (
                      <UploadParameter
                        key={parameter.name}
                        form={form}
                        parameter={parameter}
                      />
                    ) : (
                      <StringParameter
                        key={parameter.name}
                        form={form}
                        parameter={parameter}
                        onStringArrayChange={onStringArrayChange}
                      />
                    )}
                  </>
                )}
              </>
            )}
            {/* {parameters[key].name == 'lora' && (
            <>
              <Switch checked={allLoras} onChange={setAllLoras} />
              &nbsp;&nbsp;Include all Loras
            </>
          )} */}
          </div>
        )
      })
    },
    [presetConfig, showOptional],
  )

  return (
    <Form form={form} name="generate" onFinish={handleFinish}>
      <Card
        type="inner"
        title={
          <div className="py-4">
            <h3>/{generator.generatorName}</h3>
            <span style={{ color: 'gray' }}>{generator.description}</span>
          </div>
        }
        actions={[
          <div className="flex px-6 items-center justify-between">
            <Button
              type="primary"
              icon={<ExperimentOutlined />}
              htmlType="submit"
              size="large"
              className="capitalize"
            >
              {generator.generatorName}
            </Button>

            <Button type="text" onClick={resetForm}>
              Reset {presetCreation ? '(using preset)' : ''}
            </Button>
          </div>,
        ]}
      >
        {renderFormFields(requiredParameters, false)}
        {optionalParameters.length > 0 && (
          <>
            {showOptional ? (
              <Button onClick={() => setShowOptional(false)} className="mb-4">
                <UpCircleOutlined />
                Hide optional settings
              </Button>
            ) : (
              <Button onClick={() => setShowOptional(true)}>
                <DownCircleOutlined />
                Show optional settings
              </Button>
            )}
          </>
        )}
        {renderFormFields(optionalParameters, true)}
      </Card>
    </Form>
  )
}

export default GeneratorForm
