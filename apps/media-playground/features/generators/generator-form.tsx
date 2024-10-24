'use client'

import AspectRatioSelector from '@/components/form/input/aspect-ratio-selector'
import SampleCountSelector from '@/components/form/input/sample-count-selector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DialogContentOverlayBlur from '@/components/ui/custom/dialog-content-overlay-blur'
import { Dialog, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import axios, { AxiosError } from 'axios'
import { ArrowLeftIcon, Loader2, PlusIcon, Settings2Icon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type Props = {
  generator: GeneratorV2
}

const GeneratorForm = ({ generator }: Props) => {
  const [mobileIsFormVisible, setMobileIsFormVisible] = useState(false)

  const { isSignedIn, verifyAuth, refetchMe } = useAuthState()
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const groupedRequiredParameters = useMemo(
    () => (requiredParameters ? groupParameters(requiredParameters) : []),
    [requiredParameters],
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
        </div>

        <div className="flex gap-2 justify-end p-2 bg-secondary border border-t-gray-300 dark:border-t-gray-700">
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
      <div
        data-test-id="generator-form"
        className={cn([
          'flex flex-col items-start overflow-y-auto bg-muted-darker rounded-md',
          'hidden lg:flex',
        ])}
      >
        {formContent}
      </div>

      <Dialog open={mobileIsFormVisible} onOpenChange={setMobileIsFormVisible}>
        <DialogTrigger asChild>
          <div className="lg:hidden fixed bottom-0 flex z-10 bg-accent p-2 w-full justify-center">
            <Button onClick={() => setMobileIsFormVisible(true)}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Create
            </Button>
          </div>
        </DialogTrigger>
        <DialogContentOverlayBlur className="p-0 rounded-md overflow-hidden bg-muted-darker">
          <VisuallyHidden>
            <DialogTitle>{generator.name}</DialogTitle>
          </VisuallyHidden>
          {formContent}
          <DialogPrimitive.Close className="absolute w-9 h-9 top-0 left-0 rounded-t-none rounded-l-none flex items-center justify-center lg:left-2 lg:right-auto lg:top-2 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none bg-accent data-[state=open]:text-muted-foreground">
            <ArrowLeftIcon className="h-8 w-8" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogContentOverlayBlur>
      </Dialog>
    </>
  )
}

export default GeneratorForm
