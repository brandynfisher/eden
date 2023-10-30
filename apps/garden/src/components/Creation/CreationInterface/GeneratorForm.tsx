import MannaCostEstimate from '@/components/Creation/CreationInterface/MannaCostEstimate'
import ConceptParameter from '@/components/Creation/CreationInterface/parameters/ConceptParameter'
import NumberParameter from '@/components/Creation/CreationInterface/parameters/NumberParameter'
import OptionParameter from '@/components/Creation/CreationInterface/parameters/OptionParameter'
import SliderParameter from '@/components/Creation/CreationInterface/parameters/SliderParameter'
import StringParameter from '@/components/Creation/CreationInterface/parameters/StringParameter'
import UploadParameter from '@/components/Creation/CreationInterface/parameters/UploadParameter'
import PrivacyToggle from '@/components/Forms/PrivacyToggle'
import { useTaskCost } from '@/hooks/useTaskCost'
import { requireAuth } from '@/lib/auth'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { UserContext } from '@/providers/UserProvider'
import DownCircleOutlined from '@ant-design/icons/DownCircleOutlined'
import ExperimentOutlined from '@ant-design/icons/ExperimentOutlined'
import LoadingOutlined from '@ant-design/icons/LoadingOutlined'
import UpCircleOutlined from '@ant-design/icons/UpCircleOutlined'
import {
  Creation,
  Generator,
  GeneratorParameter,
  Task,
} from '@edenlabs/eden-sdk'
import LinkOutlined from '@mui/icons-material/LinkOutlined'
import { debounce } from '@mui/material/utils'
import { App, Button, Form } from 'antd'
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

// import ParameterLabel from '@/components/Creation/CreationInterface/parameters/ParameterLabel'

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
  const { setActiveTaskId, setHasChangedGenerator, refetchTasks } = useContext(
    CreationNotificationContext,
  )
  const { message } = App.useApp()
  const router = useRouter()
  const { isAuthenticated, authenticate, mannaBalance, user, refetchMe } =
    useContext(UserContext)
  const { getTaskCost, canAffordOperation, isLoadingTaskCost, taskCost } =
    useTaskCost()
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
  const [uploadsInProgress, setUploadsInProgress] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [stringArrayValues, setStringArrayValues] = useState({})

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

  const onStringArrayChange = (parameterName: string, newValues: string[]) => {
    const newStringArrayValues = { ...stringArrayValues }
    //@ts-ignore
    newStringArrayValues[parameterName] = newValues
    setStringArrayValues(newStringArrayValues)
  }

  const handleGetTaskCost = useCallback(
    async (generatorParams?: GeneratorParameter[]) => {
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

      await getTaskCost(generator.generatorName, cleanedValues)
    },
    [generator],
  )

  const handleFinish = async () => {
    // console.log('handleFinish')
    setIsSubmitting(true)

    if (!isAuthenticated) {
      await requireAuth(authenticate)

      setIsSubmitting(false)
      return
    }

    message.destroy()

    try {
      // console.log(form.getFieldsValue())
      const cleanedValues = getCleanedConfig(
        form.getFieldsValue(),
        stringArrayValues,
      )

      // console.log(cleanedValues)

      const response = await axios.post('/api/tasks/create', {
        generatorName: generator.generatorName,
        config: cleanedValues,
      })

      message.success('Task created!')

      const { taskId } = response.data
      setActiveTaskId && setActiveTaskId(taskId)
      setHasChangedGenerator && setHasChangedGenerator(false)
      refetchMe()
      refetchTasks && refetchTasks()
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
    (parameters: GeneratorParameter[]) => {
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

        return (
          <div key={parameter.name} className={`p-4 mb-4`}>
            {renderParameter(parameter)}
          </div>
        )
      })
    },
    [presetConfig],
  )

  // const AspectRatioParameter = () => {
  //   return (
  //     <div>
  //       <div>1024 x 1024 (1:1 Square)</div>
  //     </div>
  //   )
  // }
  //
  // const parameterGroups = [
  //   {
  //     label: 'Aspect Ratio',
  //     items: [
  //       {
  //         name: 'ui-aspect_ratio',
  //         input: AspectRatioParameter,
  //         label: '',
  //         description: '',
  //         setFields: ['generate_width', 'generate_height'],
  //       }
  //     ]
  //   },
  //   {
  //     label: 'Resolution',
  //     items: [
  //       {
  //         name: 'generate_width',
  //         input: SliderParameter,
  //         label: 'Width',
  //         description: 'Width of generation in pixels',
  //         placeholder: '',
  //         docsUrl: 'https://...'
  //       },
  //       {
  //         name: 'generate_height',
  //         input: SliderParameter,
  //         label: 'Height',
  //         description: 'Height of generation in pixels',
  //         placeholder: '',
  //         docsUrl: 'https://...'
  //       }
  //     ]
  //   },
  // ]

  return (
    <Form
      layout={'vertical'}
      form={form}
      name="generate"
      onFinish={handleFinish}
      key={generator.generatorName}
      onFieldsChange={debouncedHandleFormFieldsChange}
      scrollToFirstError={true}
      className="h-full flex flex-col"
    >
      <div className="p-4 bg-gray-100 dark:bg-gray-800">
        <div className="flex justify-between flex-wrap">
          <span style={{ color: 'gray' }}>{generator.description}</span>
          {generator.output === 'creation' ? (
            <a
              href="https://docs.eden.art/docs/guides/creation"
              target="_blank"
              className="flex gap-1 items-center"
            >
              Learn about Creations
              <LinkOutlined />
            </a>
          ) : null}
          {generator.output === 'concept' ? (
            <a
              href="https://docs.eden.art/docs/guides/concepts"
              target="_blank"
              className="flex gap-1 items-center"
            >
              Learn about Concepts
              <LinkOutlined />
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col flex-grow overflow-y-auto overflow-x-hidden pt-2">
        <div>{renderFormFields(requiredParameters)}</div>

        {/* start param groups --- */}
        {/*<div >*/}
        {/*  { parameterGroups.map(paramGroup =>*/}
        {/*    <div key={paramGroup.label} className="pt-2 mb-2 border border-solid border-b-0 [&:last-of-type]:pb-2 [&:last-of-type]:border-b [&:last-of-type]:border-b-gray-800  border-t-gray-800 border-r-0 border-l-0">*/}
        {/*      <div className="px-4">*/}
        {/*        <div className="font-bold">{paramGroup.label}</div>*/}
        {/*        <div className={`grid gap-4 grid-cols-${paramGroup.items.length > 1 ? '2' : '1'}`}>*/}
        {/*          { paramGroup.items.map(groupItem => {*/}
        {/*            const InputComponent = groupItem.input*/}
        {/*            return (*/}
        {/*              <div key={groupItem.name}>*/}
        {/*                <InputComponent form={form} parameter={{ label: groupItem.label, name: groupItem.name, description: groupItem.description }} />*/}
        {/*              </div>*/}
        {/*            )*/}
        {/*          })}*/}
        {/*        </div>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*  ) }*/}
        {/*</div>*/}
        {/* --- end param group */}

        {advancedParameters.length > 0 || optionalParameters.length > 0 ? (
          <>
            {showSettings ? (
              <Button
                onClick={() => setShowSettings(false)}
                className="font-mono mb-4 mx-4"
              >
                <UpCircleOutlined />
                Hide settings
              </Button>
            ) : (
              <Button
                onClick={() => setShowSettings(true)}
                className="font-mono mx-4"
              >
                <DownCircleOutlined />
                Show settings
              </Button>
            )}
          </>
        ) : null}
        <div className={`${!showSettings ? 'hidden' : ''}`}>
          <div>{renderFormFields(optionalParameters)}</div>
          <div>{renderFormFields(advancedParameters)}</div>
        </div>
      </div>

      <div
        className="p-4 text-left bg-gray-100 dark:bg-gray-800"
        key={generator.generatorName}
      >
        <div className="flex gap-4 items-center justify-between flex-wrap">
          <div className="flex gap-2 items-center w-full sm:w-auto">
            {canAffordOperation === false ? (
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
                className="font-mono capitalize w-full"
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
          </div>

          {user &&
          user.featureFlags &&
          user.featureFlags.includes('private') ? (
            <PrivacyToggle />
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap w-full justify-between items-center">
          <MannaCostEstimate
            isLoading={!!isLoadingTaskCost}
            cost={taskCost || 'n/a'}
          />

          <Button className="font-mono text-sm" onClick={resetForm}>
            Reset {presetCreation ? '(to preset)' : ''}
          </Button>
        </div>

        {uploadsInProgress ? (
          <div className="text-orange-500 mt-2 w-full">
            <LoadingOutlined className="mr-2" />
            File upload still in progress. Please wait.{' '}
          </div>
        ) : null}
      </div>
    </Form>
  )
}

export default GeneratorForm
