'use client'

import GatedPrivacySwitch from '@/components/form/gated-privacy-switch'
import AspectRatioSelector from '@/components/form/input/aspect-ratio-selector'
import SampleCountSelector from '@/components/form/input/sample-count-selector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import ParameterField from '@/features/tools/parameters/parameter-field'
import ParameterGroupCollapse from '@/features/tools/parameters/parameter-group-collapse'
import ToolSelectorModal from '@/features/tools/tool-selector-modal'
import { groupParameters } from '@/features/tools/utils/parameters'
import { useAuthState } from '@/hooks/use-auth-state'
import { useToolPreset } from '@/hooks/use-tool-preset'
import { trackTaskCreate } from '@/lib/analytics'
import { createZodFormSchema, getDefaultNameValueMap } from '@/lib/forms'
import { cn } from '@/lib/utils'
import { calculateCost } from '@/utils/cost.util'
import { ToolV2 } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { CoinsIcon, Loader2, PlusIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type Props = {
  tool: ToolV2
}

const RUNWAY_TOOL_KEYS = ['runway', 'reel']

const MASKING_PARAMETER_NAMES = ['mask_image', 'masking_prompt']
const SAMPLE_COUNT_PARAMETER_NAME = 'n_samples'
const CreationUIContainer = ({ tool }: Props) => {
  const { isSignedIn, verifyAuth, refetchMe, balance } = useAuthState()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const presetResolutions = tool?.resolutions
  const parameterSchema = createZodFormSchema(tool.parameters || []) // create form schema

  const customParams = [SAMPLE_COUNT_PARAMETER_NAME, ...MASKING_PARAMETER_NAMES]

  const sampleCountParameter = tool.parameters?.filter(
    parameter => parameter.name === SAMPLE_COUNT_PARAMETER_NAME,
  )[0]

  const maskingParameters = tool.parameters?.filter(parameter =>
    MASKING_PARAMETER_NAMES.includes(parameter.name),
  )

  type FormData = z.infer<typeof parameterSchema>
  const defaultValues: FormData | undefined = getDefaultNameValueMap(
    tool.parameters,
  )

  useEffect(() => {
    if (!isSignedIn) {
      verifyAuth()
    }
  }, [isSignedIn, verifyAuth])

  const { presetValues } = useToolPreset()

  const [, setShowSettings] = useState(false)

  const [mobileIsFormVisible, setMobileIsFormVisible] = useState(false)
  const [toolSelectorOpen, setToolSelectorOpen] = useState(false)

  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      const isMobileScreen = width < 1024 // lg breakpoint
      setIsMobile(isMobileScreen)

      // Only close the mobile form modal if switching to desktop, never open it automatically
      if (!isMobileScreen && mobileIsFormVisible) {
        setMobileIsFormVisible(false)
      }
    }

    // Check on mount
    checkScreenSize()

    // Add resize listener
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [mobileIsFormVisible])

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

  const formValues = form.watch()
  const cost = useMemo(() => {
    return calculateCost(tool.cost_estimate || '', formValues)
  }, [tool.cost_estimate, formValues])

  const hasEnoughBalance = useMemo(() => {
    return cost <= balance
  }, [cost, balance])

  // Add keyboard shortcut for CMD+Enter to submit form
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()

        // Check if form is valid and not already submitting
        if (
          !isSubmitting &&
          hasEnoughBalance &&
          Object.keys(form.formState.errors).length === 0
        ) {
          form.handleSubmit(onSubmit)()
        }
      }
    }

    // Add event listener to document
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSubmitting, hasEnoughBalance, form, onSubmit])

  // Add scroll to error effect
  useEffect(() => {
    const errors = form.formState.errors
    if (Object.keys(errors).length > 0) {
      // Small delay to ensure reliable scrolling, especially on mobile
      setTimeout(() => {
        // Find first error field element
        const firstErrorField = document.querySelector('[aria-invalid="true"]')
        if (firstErrorField) {
          firstErrorField.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }
      }, 100)
    }
  }, [form.formState.errors])

  async function onSubmit(formData: FormData) {
    if (!(await verifyAuth())) {
      return
    }

    const formValues = form.getValues()
    let foundError = false
    groupedOptionalParameters.forEach(group => {
      if (
        group.toggle &&
        (formValues as Record<string, unknown>)[group.toggle.name] === true
      ) {
        group.groupParameters?.forEach(param => {
          const value = (formValues as Record<string, unknown>)[param.name]
          const isMissing =
            value === undefined ||
            value === null ||
            (typeof value === 'string' && value.trim() === '') ||
            (Array.isArray(value) && value.length === 0)

          // For booleans and numbers, allow 0 and false as valid values
          if (
            isMissing &&
            param.schema.type !== 'boolean' &&
            param.schema.type !== 'integer' &&
            param.schema.type !== 'float'
          ) {
            form.setError(param.name as `root.${string}`, {
              type: 'required',
              message: `${param.label || param.name} is required when enabled`,
            })
            foundError = true
          }
        })
      }
    })

    if (foundError) {
      console.warn('Form has errors, not submitting', form.getValues())
      return
    }

    const { makePublic, ...args } = formData as FormData & {
      makePublic?: boolean
    }

    setIsSubmitting(true)

    try {
      await axios.post('/api/tasks/create', {
        tool: tool.key,
        args: args,
        makePublic: makePublic,
      })

      toast.success(`Task submitted`, {
        description: (
          <code className="text-xs text-foreground">Tool: {tool.key}</code>
        ),
        position: mobileIsFormVisible ? 'top-center' : 'bottom-right',
        dismissible: true,
        richColors: true,
      })

      trackTaskCreate(tool.key, cost)

      await refetchMe()

      setMobileIsFormVisible(false)
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

  const handleReset = useCallback(() => {
    if (pathname) {
      router.push(pathname, { scroll: false })
    }
    form.reset(defaultValues, { keepDefaultValues: true })
  }, [pathname, router, form, defaultValues])

  const requiredParameters = useMemo(
    () =>
      tool.parameters?.filter(
        parameter =>
          parameter.required && !customParams.includes(parameter.name),
      ),
    [tool.parameters],
  )

  const groupedRequiredParameters = useMemo(
    () =>
      (requiredParameters ? groupParameters(requiredParameters) : []).filter(
        element =>
          element.parameter?.name !== 'width' &&
          element.parameter?.name !== 'height',
      ),
    [requiredParameters],
  )

  const optionalParameters = useMemo(
    () =>
      tool.parameters?.filter(
        parameter =>
          !parameter.required && !customParams.includes(parameter.name),
      ),
    [tool.parameters],
  )

  const groupedOptionalParameters = useMemo(
    () => (optionalParameters ? groupParameters(optionalParameters) : []),
    [optionalParameters],
  )

  // remove errors if user toggles off a group
  useEffect(() => {
    const subscription = form.watch((values: Record<string, unknown>) => {
      groupedOptionalParameters.forEach(group => {
        if (group.toggle && !values[group.toggle.name]) {
          group.groupParameters?.forEach(param => {
            form.clearErrors(param.name as `root.${string}`)
          })
        }
      })
    })
    return () => subscription.unsubscribe?.()
  }, [groupedOptionalParameters, form])

  const isRunwayPoweredTool = RUNWAY_TOOL_KEYS.includes(tool.key)

  const widthParameter = tool.parameters?.find(
    parameter => parameter.name === 'width',
  )
  const heightParameter = tool.parameters?.find(
    parameter => parameter.name === 'height',
  )

  return (
    <>
      {/* Mobile floating button to open form */}
      {isMobile && (
        <div className="fixed left-0 bottom-0 flex z-10 bg-accent p-3 w-full justify-center items-center">
          <Button
            onClick={() => setMobileIsFormVisible(true)}
            className="w-full max-w-md h-12 text-base"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Creation Settings
          </Button>
        </div>
      )}

      {/* Main form container - responsive */}
      <div
        data-test-id="tool-form"
        className={cn([
          'flex flex-col items-start justify-start bg-muted-darker rounded-md h-full w-full',
          // On mobile: hidden by default, only show as overlay when clicked
          isMobile && !mobileIsFormVisible && 'hidden',
          // Mobile overlay mode
          mobileIsFormVisible && 'fixed inset-0 z-50',
        ])}
      >
        <Form {...form}>
          <form className="w-full flex flex-col justify-start h-full min-w-full min-h-0">
            <div className="flex items-start justify-between gap-3 p-2 bg-secondary border border-b-gray-300 dark:border-b-gray-700">
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <TypographyH4 className="text-sm lg:text-base">
                    {tool.name}
                  </TypographyH4>
                  {tool.base_model ? (
                    <div className="flex-shrink-0">
                      <Badge
                        variant="secondary"
                        className="ml-2 border-muted-foreground"
                      >
                        {tool.base_model}
                      </Badge>
                    </div>
                  ) : null}
                </div>
                {tool.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {tool.description}
                  </div>
                )}
              </div>

              {/* Mobile: Close button in header */}
              {isMobile && mobileIsFormVisible && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileIsFormVisible(false)}
                  className="p-2 h-10 w-10 flex-shrink-0"
                >
                  ✕
                </Button>
              )}
            </div>

            <div className="px-3 pb-3 pt-3 border-b border-secondary bg-muted-darker">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full justify-center bg-primary/15 text-primary-foreground border border-primary/40 hover:bg-primary/25"
                onClick={() => setToolSelectorOpen(true)}
              >
                Select another tool
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 py-4 flex flex-col justify-start min-h-0">
              <div
                data-test-id="tool-form-settings-required"
                className="flex flex-col gap-2"
              >
                {groupedRequiredParameters?.map((element, index) => (
                  <div key={index} className="bg-muted rounded-lg">
                    {element.type === 'standalone' && element.parameter ? (
                      <ParameterField
                        form={form}
                        tool={tool}
                        parameter={element.parameter}
                      />
                    ) : (
                      <ParameterGroupCollapse
                        tool={tool}
                        group={element}
                        form={form}
                      />
                    )}
                  </div>
                ))}

                {maskingParameters && maskingParameters.length > 0 ? (
                  <div className="bg-muted-darker border border-secondary rounded-lg space-y-2 mt-0 !p-2 md:!p-4 !pt-2">
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
                            tool={tool}
                            parameter={{ ...parameter, required: false }}
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                ) : null}

                {(presetResolutions && presetResolutions.length) ||
                sampleCountParameter ? (
                  <div className="flex flex-col gap-1">
                    {sampleCountParameter ? (
                      <SampleCountSelector parameter={sampleCountParameter} />
                    ) : null}
                    {presetResolutions && presetResolutions.length ? (
                      <div className="w-full">
                        <AspectRatioSelector
                          presetResolutions={presetResolutions}
                          form={form}
                          tool={tool}
                          widthParameter={widthParameter}
                          heightParameter={heightParameter}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {optionalParameters?.length ? (
                <div
                  data-test-id="tool-form-settings-optional"
                  className="mt-2"
                >
                  <div className="flex flex-col gap-2 w-full relative">
                    {groupedOptionalParameters?.map((element, index) => (
                      <div key={index} className="bg-muted/50 rounded-lg">
                        {element.type === 'standalone' && element.parameter ? (
                          <ParameterField
                            form={form}
                            tool={tool}
                            parameter={element.parameter}
                          />
                        ) : (
                          <ParameterGroupCollapse
                            tool={tool}
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

            {/* Footer - Clean mobile layout */}
            <div
              className={cn([
                'flex items-center p-3 bg-secondary border border-t-gray-300 dark:border-t-gray-700',
                isMobile && mobileIsFormVisible
                  ? 'justify-between'
                  : 'justify-between',
              ])}
            >
              {/* Mobile layout: Cancel + Toggle + Create */}
              {isMobile && mobileIsFormVisible ? (
                <>
                  {/* Reset button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={!isSubmitting ? handleReset : undefined}
                    disabled={isSubmitting}
                    className="px-4"
                  >
                    Reset
                  </Button>

                  {/* Public/Private toggle */}
                  <FormField
                    name="makePublic"
                    render={({ field, fieldState }) => {
                      const currentValue =
                        field.value === undefined ? true : field.value
                      return (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormLabel className="text-xs text-muted-foreground !mt-0">
                            Public
                          </FormLabel>
                          <FormControl className="mt-0 flex">
                            <GatedPrivacySwitch
                              checked={currentValue}
                              onCheckedChange={field.onChange}
                              disabled={isSubmitting}
                              entityLabel="creations"
                            />
                          </FormControl>
                          <FormMessage className="text-xs">
                            {fieldState.error?.message}
                          </FormMessage>
                        </FormItem>
                      )
                    }}
                  />

                  {/* Create button */}
                  <Button
                    type="button"
                    size="sm"
                    className="px-4 flex items-center gap-2"
                    onClick={
                      !isSubmitting ? form.handleSubmit(onSubmit) : undefined
                    }
                    disabled={
                      isSubmitting ||
                      !hasEnoughBalance ||
                      Object.keys(form.formState.errors).length > 0
                    }
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Create</span>
                        <div className="flex items-center text-xs opacity-80">
                          <CoinsIcon className="mr-1 h-3 w-3" />
                          <span className="font-mono text-xs">
                            {cost.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  {/* Desktop layout: Keep existing layout */}
                  {isRunwayPoweredTool ? (
                    <div className="flex items-center">
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

                  <FormField
                    name="makePublic"
                    render={({ field, fieldState }) => {
                      const currentValue =
                        field.value === undefined ? true : field.value
                      return (
                        <FormItem
                          data-test-id={'makePublic'}
                          className="flex items-center gap-3 space-y-0"
                        >
                          <FormLabel
                            htmlFor={field.name}
                            className="text-muted-foreground !mt-0"
                          >
                            Public
                          </FormLabel>
                          <FormControl id={field.name} className="mt-0 flex">
                            <GatedPrivacySwitch
                              checked={currentValue}
                              onCheckedChange={field.onChange}
                              disabled={isSubmitting}
                              entityLabel="creations"
                            />
                          </FormControl>
                          <FormMessage className="text-xs">
                            {fieldState.error?.message}
                          </FormMessage>
                        </FormItem>
                      )
                    }}
                  />

                  {isSignedIn && !hasEnoughBalance && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        router.push('/settings/subscription')
                      }}
                    >
                      Buy More Manna
                    </Button>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    className="min-w-[100px] flex items-center justify-between gap-3"
                    onClick={
                      !isSubmitting ? form.handleSubmit(onSubmit) : undefined
                    }
                    disabled={
                      isSubmitting ||
                      !hasEnoughBalance ||
                      Object.keys(form.formState.errors).length > 0
                    }
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Create</span>
                        <div className="flex items-center text-xs opacity-80">
                          <CoinsIcon className="mr-1 h-3 w-3" />
                          <span className="font-mono">
                            {cost.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </form>
        </Form>
      </div>

      {/* Tool Selector Modal */}
      <ToolSelectorModal
        currentTool={tool}
        open={toolSelectorOpen}
        onOpenChange={setToolSelectorOpen}
      />
    </>
  )
}

export default CreationUIContainer
