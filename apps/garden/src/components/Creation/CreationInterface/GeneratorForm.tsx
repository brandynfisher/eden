import MannaCostEstimate from '@/components/Creation/CreationInterface/MannaCostEstimate'
import ConceptParameter from '@/components/Creation/CreationInterface/parameters/ConceptParameter'
import NumberParameter from '@/components/Creation/CreationInterface/parameters/NumberParameter'
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
import { debounce } from '@mui/material'
import { App, Button, Card, Form } from 'antd'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

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
  const { refetch, isAuthenticated, authenticate, mannaBalance } =
    useContext(UserContext)
  const [form] = Form.useForm()
  const [presetConfig, setPresetConfig] = useState<Task['config']>()
  const [isFormTouched, setIsFormTouched] = useState(false)
  const [requiredParameters, setRequiredParams] = useState<
    GeneratorParameter[]
  >([])
  const [optionalParameters, setOptionalParams] = useState<
    GeneratorParameter[]
  >([])
  const [advancedParameters, setAdvancedParameters] = useState<
    GeneratorParameter[]
  >([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingTaskCost, setIsLoadingTaskCost] = useState(false)
  const [taskCost, setTaskCost] = useState<{ cost: number } | undefined>()
  const [uploadsInProgress, setUploadsInProgress] = useState(false)
  const [canAffordOperation, setCanAffordOperation] = useState(false)

  useEffect(() => {
    if (taskCost && mannaBalance) {
      setCanAffordOperation(mannaBalance >= taskCost?.cost)
    } else {
      setCanAffordOperation(false)
    }
  }, [taskCost, mannaBalance])

  useEffect(() => {
    const transformConfig = () => {
      if (!presetCreation) {
        return
      }

      setIsFormTouched(true)

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

    if (!uploadsInProgress) {
      await handleGetTaskCost()
    }
  }

  const debouncedHandleFormFieldsChange = useMemo(
    () => debounce(handleFormFieldsChange, 500),
    [handleFormFieldsChange],
  )

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
    ]
  }

  useEffect(() => {
    if (!generator) {
      return
    }

    const currentGeneratorParams = getCurrentGeneratorParameters(generator)

    if (currentGeneratorParams) {
      if (
        !presetCreation ||
        (presetCreation &&
          presetCreation.task.generator.generatorName !==
            generator.generatorName &&
          router.query.generator &&
          router.query.generator === 'remix' &&
          generator.generatorName !== 'remix')
      ) {
        resetForm()
      }

      setRequiredParams(
        currentGeneratorParams.filter(parameter => parameter.isRequired),
      )
      setOptionalParams(
        currentGeneratorParams.filter(
          parameter => !parameter.isRequired && !parameter.optional,
        ),
      )
      setAdvancedParameters(
        currentGeneratorParams.filter(
          parameter => !parameter.isRequired && parameter.optional,
        ),
      )

      handleGetTaskCost(currentGeneratorParams)
    }
  }, [generator, presetCreation])

  const [showOptional, setShowOptional] = React.useState(false)
  const [stringArrayValues, setStringArrayValues] = useState({})

  const onStringArrayChange = (parameterName: string, newValues: string[]) => {
    const newStringArrayValues = { ...stringArrayValues }
    //@ts-ignore
    newStringArrayValues[parameterName] = newValues
    setStringArrayValues(newStringArrayValues)
  }

  const handleGetTaskCost = useCallback(
    async (generatorParams?: GeneratorParameter[]) => {
      setIsLoadingTaskCost(true)

      if (!isAuthenticated) {
        await requireAuth(authenticate)

        setIsLoadingTaskCost(false)
        return
      }

      try {
        message.destroy()

        const currentGeneratorParameters =
          getCurrentGeneratorParameters(generator)
        const requiredParams = currentGeneratorParameters?.filter(
          parameter => parameter.isRequired,
        )

        let cleanedValues = getCleanedConfig(
          generatorParams || form.getFieldsValue(),
          undefined,
        )

        requiredParams?.map(reqParam => {
          if (Array.isArray(reqParam['default'])) {
            // @ts-ignore
            cleanedValues[reqParam.name] = ['dummy field content']
          } else {
            cleanedValues[reqParam.name] = 'concept'
          }
        })

        const response = await axios.post('/api/tasks/cost', {
          generatorName: generator.generatorName,
          config: cleanedValues,
        })

        setTaskCost(response.data)
      } catch (err) {
        console.error(err)
        message.error('Error fetching task cost estimate')
      } finally {
        setIsLoadingTaskCost(false)
      }
    },
    [generator],
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
    setUploadsInProgress(false)

    if (!presetCreation) {
      setIsFormTouched(false)
    }
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

        if (
          parameter.default === '' &&
          typeof parameter.minimum !== 'undefined' &&
          typeof parameter.maximum !== 'undefined' &&
          typeof parameter.minimum === 'number' &&
          typeof parameter.maximum === 'number'
        ) {
          return (
            <NumberParameter
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
              acceptedMimeTypes={parameter.mediaUpload}
              onUploadInProgress={(uploading: boolean) =>
                setUploadsInProgress(uploading)
              }
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

  return (
    <Form
      form={form}
      name="generate"
      onFinish={handleFinish}
      key={generator.generatorName}
      title={generator.generatorName}
      onFieldsChange={debouncedHandleFormFieldsChange}
      scrollToFirstError={true}
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
            <div>
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
                      isSubmitting ||
                      !isFormTouched ||
                      uploadsInProgress ||
                      !canAffordOperation
                    }
                  >
                    {generator.generatorName}
                  </Button>
                )}
                <MannaCostEstimate
                  isLoading={isLoadingTaskCost}
                  cost={taskCost?.cost || 'n/a'}
                />
              </div>
              {uploadsInProgress ? (
                <div className="text-orange-500 mt-4">
                  <LoadingOutlined className="mr-2" />
                  File upload still in progress. Please wait.{' '}
                </div>
              ) : null}
            </div>

            <Button className="font-mono" type="text" onClick={resetForm}>
              Reset {presetCreation ? '(using preset)' : ''}
            </Button>
          </div>,
        ]}
      >
        {renderFormFields(requiredParameters, false)}
        {renderFormFields(optionalParameters, false)}
        {advancedParameters.length > 0 && (
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
        {renderFormFields(advancedParameters, true)}
      </Card>
    </Form>
  )
}

export default GeneratorForm
