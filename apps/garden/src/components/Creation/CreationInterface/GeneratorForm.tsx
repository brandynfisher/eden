import ConceptSelectModalTrigger from '@/components/Creation/CreationInterface/ConceptSelectModalTrigger'
import CreationPresetInfo from '@/components/Creation/CreationInterface/CreationPresetInfo'
import { OutputType } from '@/components/Creation/CreationInterface/CreationWorkspace'
import MannaCostBadge from '@/components/Creation/CreationInterface/MannaCostBadge'
// import AspectRatioParameter from '@/components/Creation/CreationInterface/parameters/AspectRatioParameter'
import ConceptParameter from '@/components/Creation/CreationInterface/parameters/ConceptParameter'
import NumberParameter from '@/components/Creation/CreationInterface/parameters/NumberParameter'
import OptionParameter from '@/components/Creation/CreationInterface/parameters/OptionParameter'
import SliderParameter from '@/components/Creation/CreationInterface/parameters/SliderParameter'
import StringParameter from '@/components/Creation/CreationInterface/parameters/StringParameter'
import UploadParameter from '@/components/Creation/CreationInterface/parameters/UploadParameter'
import PrivacyToggle from '@/components/Forms/PrivacyToggle'
import { useTaskCost } from '@/hooks/useTaskCost'
import { requireAuth } from '@/lib/auth'
import { parameterGroups, supportsGroup } from '@/lib/generator'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { UserContext } from '@/providers/UserProvider'
import ExperimentOutlined from '@ant-design/icons/ExperimentOutlined'
import LoadingOutlined from '@ant-design/icons/LoadingOutlined'
import {
  Creation,
  Generator,
  GeneratorParameter,
  Task,
} from '@edenlabs/eden-sdk'
import { debounce } from '@mui/material/utils'
import { App, Button, Collapse, Form } from 'antd'
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

import SamplesParameter from './parameters/SamplesParameter'

// import UpscaleParameter from './parameters/UpscaleParameter'
const { Panel } = Collapse

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
    .filter(key => !key.endsWith('--preset') && !key.startsWith('ui-'))
    .reduce((obj: FieldValues, key) => {
      // @ts-ignore
      obj[key] = consolidatedFieldValues[key]
      return obj
    }, {})
}

// const parameterGroups = [
// {
//   label: 'Resolution',
//   items: [
//     {
//       name: 'generate_width',
//       input: SliderParameter,
//       label: 'Width',
//       description: 'Width of generation in pixels',
//       placeholder: '',
//       docsUrl: 'https://...'
//     },
//     {
//       name: 'generate_height',
//       input: SliderParameter,
//       label: 'Height',
//       description: 'Height of generation in pixels',
//       placeholder: '',
//       docsUrl: 'https://...'
//     }
//   ]
// },
// ]

const GeneratorForm = ({
  usesDrawer,
  openedDrawer,
  generator,
  presetCreation,
  onSubmitSuccess,
  outputType,
}: {
  usesDrawer?: boolean
  openedDrawer?: boolean
  generator: Generator
  presetCreation?: Creation
  onSubmitSuccess?: () => void
  outputType?: OutputType
}) => {
  const { setActiveTaskId, setHasChangedGenerator, refetchTasks } = useContext(
    CreationNotificationContext,
  )
  const { message } = App.useApp()
  const router = useRouter()
  const { isAuthenticated, authenticate, mannaBalance, user, refetchMe } =
    useContext(UserContext)
  const { getTaskCost, canAffordOperation, taskCost } = useTaskCost()
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
  const [stringArrayValues, setStringArrayValues] = useState({})

  const submitButtonDisabledProd =
    isSubmitting || !isFormTouched || uploadsInProgress || !canAffordOperation
  const submitButtonDisabledDev = false
  const submitButtonDisabled =
    process.env.NODE_ENV === 'production'
      ? submitButtonDisabledProd
      : submitButtonDisabledDev

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

      if (!router.query.generator && router.query.presetId) {
        setPresetConfig({
          ...presetCreation.task.config,
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

  const handleFormFieldsChange = () => {
    setIsFormTouched(true)

    if (!uploadsInProgress) {
      handleGetTaskCost()
    }
  }

  const debouncedHandleFormFieldsChange = useMemo(
    () => debounce(handleFormFieldsChange, 350),
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

      getTaskCost(generator.generatorName, form.getFieldsValue())
    }
  }, [generator, presetCreation])

  const onStringArrayChange = (parameterName: string, newValues: string[]) => {
    const newStringArrayValues = { ...stringArrayValues }
    //@ts-ignore
    newStringArrayValues[parameterName] = newValues
    setStringArrayValues(newStringArrayValues)
  }

  const handleGetTaskCost = useCallback(
    (generatorParams?: GeneratorParameter[]) => {
      const currentGeneratorParameters =
        getCurrentGeneratorParameters(generator)
      const requiredParams = currentGeneratorParameters?.filter(
        parameter => parameter.isRequired,
      )

      const paramValues: FieldValues = {}
      generatorParams?.map(param => (paramValues[param.name] = param.default))

      let cleanedValues = getCleanedConfig(
        generatorParams ? paramValues : form.getFieldsValue(),
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

      getTaskCost(generator.generatorName, cleanedValues)
    },
    [generator],
  )

  const supportsConcepts = supportsGroup(advancedParameters, 'concept')
  const supportsInitImage = supportsGroup(advancedParameters, 'init_image')

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
              onFieldChange={debouncedHandleFormFieldsChange}
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

        return <div key={parameter.name}>{renderParameter(parameter)}</div>
      })
    },
    [presetConfig],
  )

  const getInitialValue = useCallback(
    (parameterName: string) => {
      const currentGeneratorParams = getCurrentGeneratorParameters(generator)

      if (presetConfig) {
        const presetParameter = Object.entries(presetConfig).filter(
          ([key]) => key === parameterName,
        )[0]

        if (presetParameter) {
          return presetParameter[1]
        }
      }

      const currentParamDefault = currentGeneratorParams?.filter(
        param => param.name === parameterName,
      )[0]

      return currentParamDefault ? currentParamDefault.default : 0
    },
    [generator, presetConfig],
  )

  return (
    <Form
      layout={'vertical'}
      form={form}
      name="generate"
      onFinish={handleFinish}
      key={generator.generatorName}
      onFieldsChange={debouncedHandleFormFieldsChange}
      className={`flex flex-col h-full`}
    >
      <div className={usesDrawer && !openedDrawer ? 'hidden' : ''}>
        {presetCreation && <CreationPresetInfo creation={presetCreation} />}
      </div>

      <div
        className={`flex-col flex-grow bg-gray-100 dark:bg-gray-900 overflow-y-auto overflow-x-hidden ${
          usesDrawer && openedDrawer ? 'max-h-[46vh]' : ''
        } ${usesDrawer && !openedDrawer ? 'hidden' : 'flex'}`}
      >
        <div className={`p-4 bg-gray-100 dark:bg-gray-900`}>
          {renderFormFields(requiredParameters)}

          {/* decorative / extra params linked to the actual param input */}
          {outputType === 'image' ||
          (outputType === 'video' &&
            generator.generatorName !== 'dialogue' &&
            generator.generatorName !== 'monologue' &&
            generator.generatorName !== 'wav2lip') ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex gap-2">
                {outputType === 'image' &&
                generator.generatorName !== 'blend' ? (
                  <SamplesParameter
                    form={form}
                    name="ui-samples"
                    initialValue={getInitialValue('n_samples')}
                  />
                ) : (
                  <div className="hidden">frames</div>
                )}
                {/*<UpscaleParameter form={form} name="ui-upscale"/>*/}
              </div>
              {/*<AspectRatioParameter*/}
              {/*  form={form}*/}
              {/*  name="ui-aspect-ratio"*/}
              {/*  initialValue={{*/}
              {/*    width: getInitialValue('width'),*/}
              {/*    height: getInitialValue('height'),*/}
              {/*  }}*/}
              {/*/>*/}
            </div>
          ) : null}
        </div>

        {advancedParameters.length > 0 || optionalParameters.length > 0 ? (
          <Collapse
            expandIconPosition="start"
            className={`generator-settings-collapse`}
          >
            {optionalParameters.length > 0 ? (
              <Panel key={'1'} header={'Settings'} forceRender={true}>
                <div className="px-3 flex flex-col gap-4 py-4 bg-gray-200 dark:bg-gray-900">
                  {renderFormFields(optionalParameters)}
                </div>
              </Panel>
            ) : null}
            {supportsConcepts ? (
              <Panel key={'3'} header={'Concept'} forceRender={true}>
                <div className="px-3 flex flex-col gap-4 py-4 bg-gray-200 dark:bg-gray-900">
                  <ConceptSelectModalTrigger onChange={() => {}} />
                  {renderFormFields(
                    advancedParameters.filter(p =>
                      parameterGroups['concept'].includes(p.name),
                    ),
                  )}
                </div>
              </Panel>
            ) : null}
            {supportsInitImage ? (
              <Panel key={'4'} header={'Starting Image'} forceRender={true}>
                <div className="px-3 flex flex-col gap-4 py-4 bg-gray-200 dark:bg-gray-900">
                  {renderFormFields(
                    advancedParameters.filter(p =>
                      parameterGroups['init_image'].includes(p.name),
                    ),
                  )}
                </div>
              </Panel>
            ) : null}
            {advancedParameters.length > 0 ? (
              <Panel key={'2'} header={'Advanced'} forceRender={true}>
                <div className="px-3 flex flex-col gap-4 py-4 bg-gray-200 dark:bg-gray-900">
                  {renderFormFields(
                    advancedParameters.filter(
                      p =>
                        !parameterGroups['concept'].includes(p.name) &&
                        !parameterGroups['init_image'].includes(p.name),
                    ),
                  )}
                </div>
              </Panel>
            ) : null}
          </Collapse>
        ) : null}
      </div>

      <div
        className={`p-4 text-left bg-gray-100 dark:bg-gray-800 ${
          usesDrawer && !openedDrawer ? 'pt-2' : ''
        }`}
        key={generator.generatorName}
      >
        <div className="flex gap-4 items-center justify-between flex-wrap">
          <div className="flex gap-2 items-center w-auto">
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
                className="font-mono capitalize w-full flex items-center flex-shrink-0 justify-between !pr-2"
                loading={isSubmitting ? { delay: 250 } : false}
                disabled={submitButtonDisabled}
              >
                Create
                <MannaCostBadge cost={taskCost || 'n/a'} />
              </Button>
            )}
          </div>

          {user &&
          user.featureFlags &&
          user.featureFlags.includes('preview') ? (
            <PrivacyToggle />
          ) : null}
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
