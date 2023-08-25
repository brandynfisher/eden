import ConceptParameter from '@/components/Creation/CreationInterface/parameters/ConceptParameter'
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
  LoadingOutlined,
  UpCircleOutlined,
} from '@ant-design/icons'
import {
  Creation,
  Generator,
  GeneratorParameter,
  Task,
} from '@edenlabs/eden-sdk'
import { HelpOutline } from '@mui/icons-material'
import { App, Button, Card, Form, Popover } from 'antd'
import axios from 'axios'
import { useRouter } from 'next/router'
import React, { useCallback, useContext, useEffect, useState } from 'react'

type FieldValues = { [key: string]: string }

const getCleanedConfig = (
  formFieldValues: FieldValues | GeneratorParameter[],
  stringArrayValues: FieldValues | undefined,
) => {
  const consolidatedFieldValues = {
    ...formFieldValues,
    ...stringArrayValues,
  }

  // filter out temporary preset form values
  return Object.keys(consolidatedFieldValues)
    .filter(key => !key.endsWith('--preset'))
    .reduce((obj: FieldValues, key) => {
      // @ts-ignore
      obj[key] = consolidatedFieldValues[key]
      return obj
    }, {})
}

const GeneratorForm = ({
  generator,
  presetCreation,
  onSubmitSuccess,
}: {
  generator: Generator
  presetCreation?: Creation
  onSubmitSuccess?: () => void
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
  const [isFormTouched, setIsFormTouched] = useState(false)
  const [initialParams, setInitialParams] = useState<GeneratorParameter[]>([])
  const [requiredParameters, setRequiredParams] = useState<
    GeneratorParameter[]
  >([])
  const [optionalParameters, setOptionalParams] = useState<
    GeneratorParameter[]
  >([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingTaskCost, setIsLoadingTaskCost] = useState(false)
  const [taskCost, setTaskCost] = useState<{ cost: number } | undefined>()

  useEffect(() => {
    const transformConfig = () => {
      if (!presetCreation) {
        return
      }

      // if is "recreate": add fields to pre-populate media/image upload fields by uri
      if (router.query.generator && router.query.generator === 'remix') {
        setPresetConfig({
          ...presetCreation.task.config,
          init_image_strength: 0.175,
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

  const handleFormFieldsChange = async () => {
    setIsFormTouched(true)
    await handleGetTaskCost(getCurrentGeneratorParameters(generator))
  }

  const getCurrentGeneratorParameters = (currentGenerator: Generator) => {
    if (!currentGenerator) return

    const selectedVersion =
      currentGenerator.versions[currentGenerator.versions.length - 1]

    if (!selectedVersion) return

    const { parameters } = selectedVersion

    if (!parameters.length) return

    return [
      ...parameters.map(param => ({
        ...param,
        default: param.default === null ? '' : param.default,
      })),
    ] as GeneratorParameter[]
  }

  useEffect(() => {
    const currentGeneratorParams = getCurrentGeneratorParameters(generator)

    if (currentGeneratorParams) {
      setRequiredParams(
        currentGeneratorParams.filter(parameter => parameter.isRequired),
      )
      setOptionalParams(
        currentGeneratorParams.filter(parameter => !parameter.isRequired),
      )
      setInitialParams(currentGeneratorParams)
      handleGetTaskCost(currentGeneratorParams)
    }
  }, [generator])

  const [showOptional, setShowOptional] = React.useState(false)
  const [stringArrayValues, setStringArrayValues] = useState({})

  const onStringArrayChange = (parameterName: string, newValues: string[]) => {
    const newStringArrayValues = { ...stringArrayValues }
    //@ts-ignore
    newStringArrayValues[parameterName] = newValues
    setStringArrayValues(newStringArrayValues)
  }

  const handleGetTaskCost = useCallback(
    async (generatorParams: GeneratorParameter[] | undefined) => {
      if (isLoadingTaskCost) {
        return
      }

      if (!generatorParams) {
        setTaskCost(undefined)
        return
      }

      setIsLoadingTaskCost(true)

      if (!isAuthenticated) {
        await requireAuth(authenticate)

        setIsLoadingTaskCost(false)
        return
      }

      message.destroy()

      try {
        let cleanedValues = getCleanedConfig(generatorParams, undefined)
        const requiredParams = generatorParams.filter(
          parameter => parameter.isRequired,
        )

        requiredParams.map(reqParam => {
          if (Array.isArray(reqParam['default'])) {
            // @ts-ignore
            cleanedValues[reqParam.name] = ['dummy field content']
          } else {
            cleanedValues[reqParam.name] = 'dummy field content'
          }
        })

        const response = await axios.post('/api/tasks/cost', {
          generatorName: generator.generatorName,
          config: cleanedValues,
        })

        setTaskCost(response.data)
      } catch (err) {
        message.error('Error fetching task cost estimate')
      } finally {
        setIsLoadingTaskCost(false)
      }
    },
    [generator, initialParams],
  )

  const handleFinish = async () => {
    setIsSubmitting(true)

    if (!isAuthenticated) {
      await requireAuth(authenticate)

      setIsSubmitting(false)
      return
    }

    message.destroy()

    try {
      const cleanedValues = getCleanedConfig(
        form.getFieldsValue(),
        stringArrayValues,
      )

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
      onSubmitSuccess && onSubmitSuccess()
    } catch (error) {
      message.error('Error creating task. Please try again.')
    } finally {
      setIsSubmitting(false)
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
      const renderParameter = (parameter: GeneratorParameter) => {
        if (
          (parameter.allowedValues && parameter.allowedValues.length > 0) ||
          parameter.allowedValuesFrom
        ) {
          return (
            <OptionParameter
              key={parameter.name}
              form={form}
              parameter={parameter}
            />
          )
        }
        if (typeof parameter.default === 'number') {
          return (
            <SliderParameter
              key={parameter.name}
              form={form}
              parameter={parameter}
            />
          )
        }
        if (parameter.mediaUpload) {
          return (
            <UploadParameter
              key={parameter.name}
              form={form}
              parameter={parameter}
              acceptedMimeTypes={'image/png, image/jpeg, image/webp'}
            />
          )
        }
        if (parameter.name === 'lora') {
          return (
            <ConceptParameter
              key={parameter.name}
              form={form}
              parameter={parameter}
            />
          )
        }
        return (
          <StringParameter
            key={parameter.name}
            form={form}
            parameter={parameter}
            onStringArrayChange={onStringArrayChange}
          />
        )
      }

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
            {renderParameter(parameter)}
          </div>
        )
      })
    },
    [presetConfig, showOptional],
  )

  useEffect(() => {
    if (form) {
      setIsFormTouched(form.isFieldsTouched())
    }
  }, [form])

  return (
    <Form
      form={form}
      name="generate"
      onFinish={handleFinish}
      key={generator.generatorName}
      title={generator.generatorName}
      onFieldsChange={handleFormFieldsChange}
    >
      <Card
        type="inner"
        title={
          <div className="py-4">
            <h3>/{generator.generatorName}</h3>
            <span style={{ color: 'gray' }}>{generator.description}</span>
          </div>
        }
        actions={[
          <div
            key={generator.generatorName}
            className="flex px-6 items-center justify-between flex-wrap"
          >
            <div className="flex gap-3 items-center">
              <Button
                type="primary"
                icon={<ExperimentOutlined />}
                htmlType="submit"
                size="large"
                className="font-mono capitalize"
                loading={isSubmitting ? { delay: 250 } : false}
                disabled={isSubmitting || !isFormTouched}
              >
                {generator.generatorName}
              </Button>
              {(isLoadingTaskCost || taskCost) && (
                <div className="flex items-center gap-2 font-mono text-gray-400">
                  <div className="cursor-default">
                    {isLoadingTaskCost ? (
                      <LoadingOutlined />
                    ) : (
                      <span className="font-bold">{taskCost?.cost}</span>
                    )}{' '}
                    Manna
                  </div>
                  <Popover
                    content={
                      <div>
                        Displays the estimated manna cost for this operation
                      </div>
                    }
                    title="Manna Cost"
                    trigger="click"
                  >
                    <HelpOutline
                      fontSize="small"
                      className="hover:text-blue-400"
                    />
                  </Popover>
                </div>
              )}
            </div>

            <Button className="font-mono" type="text" onClick={resetForm}>
              Reset {presetCreation ? '(using preset)' : ''}
            </Button>
          </div>,
        ]}
      >
        {renderFormFields(requiredParameters, false)}
        {optionalParameters.length > 0 && (
          <>
            {showOptional ? (
              <Button
                onClick={() => setShowOptional(false)}
                className="font-mono mb-4"
              >
                <UpCircleOutlined />
                Hide optional settings
              </Button>
            ) : (
              <Button
                onClick={() => setShowOptional(true)}
                className="font-mono"
              >
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
