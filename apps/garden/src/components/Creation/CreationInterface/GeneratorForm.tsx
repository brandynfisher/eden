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
import { Generator, GeneratorParameter, Task } from '@edenlabs/eden-sdk'
import { App, Button, Card, Form } from 'antd'
import axios from 'axios'
import React, { useCallback, useContext, useEffect, useState } from 'react'

const GeneratorForm = ({
  generator,
  presetConfig,
}: {
  generator: Generator
  presetConfig?: Task['config']
}) => {
  const {
    taskIds,
    setTaskIds,
    setActiveTaskId,
    setHasChangedGenerator,
    refetchPendingTasks,
  } = useContext(CreationNotificationContext)
  const { message } = App.useApp()
  const { refetch, isAuthenticated, authenticate } = useContext(UserContext)
  const [form] = Form.useForm()
  const [config, setConfig] = useState(presetConfig)
  const [initialParams, setInitialParams] = useState<GeneratorParameter[]>([])
  const [requiredParameters, setRequiredParams] = useState<
    GeneratorParameter[]
  >([])
  const [optionalParameters, setOptionalParams] = useState<
    GeneratorParameter[]
  >([])

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
      const consolidatedFieldValues = {
        ...formFieldValues,
        ...stringArrayValues,
      }

      const response = await axios.post('/api/tasks/create', {
        generatorName: generator.generatorName,
        config: consolidatedFieldValues,
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
    setConfig({})
  }

  const renderFormFields = useCallback(
    (parameters: GeneratorParameter[], isOptional: boolean) => {
      return parameters.map(parameter => {
        if (config) {
          const presetParameter = Object.entries(config).filter(
            ([key]) => key === parameter.name,
          )[0]

          if (presetParameter) {
            parameter.default = presetParameter[1]
          }
        }

        if (!presetConfig && isOptional && !showOptional) {
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
    [config, showOptional],
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
              Reset {presetConfig ? '(using preset)' : ''}
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
