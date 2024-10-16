'use client'

import AspectRatioSelector from '@/components/form/input/aspect-ratio-selector'
import SampleCountSelector from '@/components/form/input/sample-count-selector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import CostIndicatorV2 from '@/features/generators/cost-indicator-v2'
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
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type Props = {
  generator: GeneratorV2
}

const GeneratorForm = ({ generator }: Props) => {
  const { isSignedIn, verifyAuth, refetchMe } = useAuthState()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // const hasAspectRatioSelector = generator.parameters?.some(
  //   param => param.name === 'width' || param.name === 'height',
  // )
  const presetResolutions = generator?.resolutions
  const parameterSchema = createZodFormSchema(generator.parameters || []) // create form schema
  const sampleCountParameter = generator.parameters?.filter(
    parameter => parameter.name === 'n_samples',
  )[0]

  type FormData = z.infer<typeof parameterSchema>
  const defaultValues: FormData | undefined = getDefaultNameValueMap(
    generator.parameters,
  )

  useEffect(() => {
    if (!isSignedIn) {
      verifyAuth()
    }
  }, [isSignedIn, verifyAuth])

  const {
    presetValues,
    // isLoading: isPresetLoading,
    // error: presetError
  } = useToolPreset()

  const [showSettings, setShowSettings] = useState(false)

  // console.log({ presetValues, defaultValues })

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

    console.log('onSubmit', formData)
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
        parameter => parameter.required && parameter.name !== 'n_samples',
      ),
    [generator.parameters],
  )

  const optionalParameters = useMemo(
    () =>
      generator.parameters?.filter(
        parameter => !parameter.required && parameter.name !== 'n_samples',
      ),
    [generator.parameters],
  )

  const groupedOptionalParameters = useMemo(
    () => (optionalParameters ? groupParameters(optionalParameters) : []),
    [optionalParameters],
  )

  return (
    <div
      data-test-id="generator-form"
      className="flex flex-col items-start overflow-y-auto bg-muted-darker rounded-md p-2"
    >
      <Form {...form}>
        <form className="w-full">
          <TypographyH4 className="mb-2 flex items-center justify-between">
            {generator.name}
            {generator.private ? (
              <Badge variant="destructive">private</Badge>
            ) : null}
          </TypographyH4>
          <div
            data-test-id="generator-form-settings-required"
            className="flex flex-col gap-2"
          >
            {requiredParameters?.map(parameter => (
              <div key={parameter.name} className="bg-muted rounded-lg">
                <ParameterField
                  tool={generator}
                  parameter={parameter}
                  form={form}
                />
              </div>
            ))}
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

          <div className="flex justify-between flex-wrap gap-2 mt-4 mb-2">
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

            <div className="flex gap-2 justify-between">
              <CostIndicatorV2 formula={generator.costEstimate} />

              <Button
                type="button"
                className="ml-auto w-[72px]"
                onClick={
                  !isSubmitting ? form.handleSubmit(onSubmit) : undefined
                }
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Create</>
                )}
              </Button>
            </div>
          </div>
          {optionalParameters?.length ? (
            <div
              data-test-id="generator-form-settings-optional"
              className={cn([showSettings ? '' : 'overflow-hidden'])}
            >
              <div
                className={cn([
                  'flex flex-col gap-2 w-full relative transition-all',
                  showSettings ? ' mb-2' : 'max-h-0 ',
                ])}
              >
                {groupedOptionalParameters?.map((element, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg">
                    {element.type === 'standalone' && element.parameter ? (
                      <ParameterField
                        tool={generator}
                        parameter={element.parameter}
                        form={form}
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
        </form>
      </Form>
    </div>
  )
}

export default GeneratorForm
