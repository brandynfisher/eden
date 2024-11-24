'use client'

import AspectRatioSelector from '@/components/form/input/aspect-ratio-selector'
import SampleCountSelector from '@/components/form/input/sample-count-selector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import CostIndicatorV2 from '@/features/generators/cost-indicator-v2'
import CreationUIMobile from '@/features/generators/creation-ui-mobile'
import ParameterField from '@/features/generators/parameters/parameter-field'
import ParameterGroupCollapse from '@/features/generators/parameters/parameter-group-collapse'
import { groupParameters } from '@/features/generators/utils/parameters'
import { useAuthState } from '@/hooks/use-auth-state'
import { useToolPreset } from '@/hooks/use-tool-preset'
import { createZodFormSchema, getDefaultNameValueMap } from '@/lib/forms'
import { cn } from '@/lib/utils'
import { GeneratorV2 } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { Loader2, Settings2Icon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type Props = {
  generator: GeneratorV2
}

const RUNWAY_TOOL_KEYS = ['runway', 'reel']

const MASKING_PARAMETER_NAMES = ['mask_image', 'masking_prompt']
const SAMPLE_COUNT_PARAMETER_NAME = 'n_samples'

const CreationUIContainer = ({ generator }: Props) => {
  const { isSignedIn, verifyAuth, refetchMe } = useAuthState()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const presetResolutions = generator?.resolutions
  const parameterSchema = createZodFormSchema(generator.parameters || []) // create form schema

  const customParams = [SAMPLE_COUNT_PARAMETER_NAME, ...MASKING_PARAMETER_NAMES]

  const sampleCountParameter = generator.parameters?.filter(
    parameter => parameter.name === SAMPLE_COUNT_PARAMETER_NAME,
  )[0]

  const maskingParameters = generator.parameters?.filter(parameter =>
    MASKING_PARAMETER_NAMES.includes(parameter.name),
  )

  type FormData = z.infer<typeof parameterSchema>
  const defaultValues: FormData | undefined = getDefaultNameValueMap(
    generator.parameters,
  )

  useEffect(() => {
    if (!isSignedIn) {
      verifyAuth()
    }
  }, [isSignedIn, verifyAuth])

  const { presetValues } = useToolPreset()

  const [showSettings, setShowSettings] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(parameterSchema), // use generated form schema for resolver
    defaultValues,
  })

  useEffect(() => {
    if (presetValues) {
      setShowSettings(true)
      form.reset({ ...defaultValues, ...presetValues })
    } else {
      form.reset({ ...defaultValues, lora: '' })
    }
  }, [presetValues])

  async function onSubmit(formData: FormData) {
    if (!(await verifyAuth())) {
      return
    }

    // console.log('onSubmit', formData)
    // return

    setIsSubmitting(true)

    try {
      const response = await axios.post('/api/tasks/create', {
        workflow: generator.key,
        args: formData,
      })

      console.log({ response })

      toast.success(`Task submitted`, {
        description: (
          <code className="text-xs text-foreground">Tool: {generator.key}</code>
        ),
        dismissible: true,
        richColors: true,
      })

      await refetchMe()
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? JSON.parse((err as AxiosError).request.responseText)?.message
        : 'Unknown Error'

      toast.error(`Failed to submit task!`, {
        description: JSON.stringify(errorMessage),
        dismissible: true,
        richColors: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const router = useRouter()
  const pathname = usePathname()

  const handleReset = useCallback(() => {
    router.push(pathname, { scroll: false })
    form.reset(defaultValues, { keepDefaultValues: true })
  }, [pathname])

  const requiredParameters = useMemo(
    () =>
      generator.parameters?.filter(
        parameter =>
          parameter.required && !customParams.includes(parameter.name),
      ),
    [generator.parameters],
  )

  const groupedRequiredParameters = useMemo(
    () => (requiredParameters ? groupParameters(requiredParameters) : []),
    [requiredParameters],
  )

  const optionalParameters = useMemo(
    () =>
      generator.parameters?.filter(
        parameter =>
          !parameter.required && !customParams.includes(parameter.name),
      ),
    [generator.parameters],
  )

  const groupedOptionalParameters = useMemo(
    () => (optionalParameters ? groupParameters(optionalParameters) : []),
    [optionalParameters],
  )

  const isRunwayPoweredTool = RUNWAY_TOOL_KEYS.includes(generator.key)

  const formContent = (
    <Form {...form}>
      <form className="w-full">
        <div className="flex items-center lg:justify-between p-2 bg-secondary border border-b-gray-300 dark:border-b-gray-700">
          <TypographyH4 className="text-sm md:text-lg pl-8 md:pl-12 lg:pl-0">
            {generator.name}
          </TypographyH4>
          {generator.baseModel || generator.private ? (
            <div className="flex-shrink-0">
              {generator.baseModel ? (
                <Badge
                  variant="outline"
                  className="ml-2 border-muted-foreground"
                >
                  {generator.baseModel}
                </Badge>
              ) : null}
              {generator.private ? (
                <Badge variant="destructive" className="ml-2">
                  private
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="max-h-[calc(100dvh_-_264px)] overflow-y-auto p-2 py-4">
          <div
            data-test-id="generator-form-settings-required"
            className="flex flex-col gap-2"
          >
            {groupedRequiredParameters?.map((element, index) => (
              <div key={index} className="bg-muted rounded-lg">
                {element.type === 'standalone' && element.parameter ? (
                  <ParameterField
                    form={form}
                    tool={generator}
                    parameter={element.parameter}
                  />
                ) : (
                  <ParameterGroupCollapse
                    tool={generator}
                    group={element}
                    form={form}
                  />
                )}
              </div>
            ))}

            {maskingParameters && maskingParameters.length > 0 ? (
              <div className="bg-muted-darker border border-secondary rounded-lg space-y-2 mt-0 !p-4 !pt-2">
                <div className="text-sm font-medium text-foreground">
                  Masking
                </div>
                <Tabs
                  defaultValue={'mask_image'}
                  className="rounded-lg bg-secondary"
                >
                  <TabsList className="w-full flex gap-1">
                    <TabsTrigger value="mask_image" className="w-full">
                      Use Image
                    </TabsTrigger>
                    <TabsTrigger value="masking_prompt" className="w-full">
                      Use Prompt
                    </TabsTrigger>
                  </TabsList>

                  {maskingParameters?.map(parameter => (
                    <TabsContent
                      key={parameter.name}
                      value={parameter.name}
                      className="mt-0"
                    >
                      <ParameterField
                        form={form}
                        tool={generator}
                        parameter={{ ...parameter, required: false }}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            ) : null}

            {(presetResolutions && presetResolutions.length) ||
            sampleCountParameter ? (
              <div className="flex items-center justify-between">
                {sampleCountParameter ? (
                  <SampleCountSelector parameter={sampleCountParameter} />
                ) : null}
                {presetResolutions && presetResolutions.length ? (
                  <div className="flex ml-auto">
                    <AspectRatioSelector
                      presetResolutions={presetResolutions}
                      form={form}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex justify-between flex-wrap gap-2 mt-2">
            <div className="flex gap-2 items-center">
              {optionalParameters?.length ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="flex items-center gap-2"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings2Icon className="h-4 w-4" />
                  Settings
                </Button>
              ) : null}

              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-muted-foreground px-1"
                onClick={!isSubmitting ? handleReset : undefined}
                disabled={isSubmitting}
              >
                Reset
              </Button>
            </div>
          </div>
          {optionalParameters?.length ? (
            <div
              data-test-id="generator-form-settings-optional"
              className={cn([showSettings ? 'mt-2' : 'overflow-hidden'])}
            >
              <div
                className={cn([
                  'flex flex-col gap-2 w-full relative transition-all',
                  showSettings ? '' : 'max-h-0 ',
                ])}
              >
                {groupedOptionalParameters?.map((element, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg">
                    {element.type === 'standalone' && element.parameter ? (
                      <ParameterField
                        form={form}
                        tool={generator}
                        parameter={element.parameter}
                      />
                    ) : (
                      <ParameterGroupCollapse
                        tool={generator}
                        group={element}
                        form={form}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-2 justify-end p-2 bg-secondary border border-t-gray-300 dark:border-t-gray-700">
          {isRunwayPoweredTool ? (
            <div className="flex items-center mr-auto">
              <a
                href={'https://runwayml.com'}
                target={'_blank'}
                rel="noreferrer noopener nofollow"
                className="dark:invert"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="object-contain h-4"
                  alt="powered by runway"
                  src="https://runway-static-assets.s3.amazonaws.com/site/images/api-page/powered-by-runway-black.png"
                ></img>
              </a>
            </div>
          ) : null}

          <CostIndicatorV2 formula={generator.costEstimate} />

          <Button
            type="button"
            size="sm"
            className="w-[72px]"
            onClick={!isSubmitting ? form.handleSubmit(onSubmit) : undefined}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>Create</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )

  return (
    <>
      {/*  // Desktop: hidden on smaller screens */}
      <div
        data-test-id="generator-form"
        className={cn([
          'flex flex-col items-start overflow-y-auto bg-muted-darker rounded-md',
          'hidden lg:flex',
        ])}
      >
        {formContent}
      </div>

      {/* // Mobile: hidden on larger screens */}
      <CreationUIMobile generator={generator}>{formContent}</CreationUIMobile>
    </>
  )
}

export default CreationUIContainer
