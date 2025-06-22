'use client'

import { SubscriptionCrownBadge } from '@/components/badge/subscription-crown-badge'
import AspectRatioSelector from '@/components/form/input/aspect-ratio-selector'
import SampleCountSelector from '@/components/form/input/sample-count-selector'
import { useSidebar } from '@/components/layout/sidebar-layout'
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
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import CostIndicatorV2 from '@/features/tools/cost-indicator-v2'
import CreationUIMobile from '@/features/tools/creation-ui-mobile'
import ParameterField from '@/features/tools/parameters/parameter-field'
import ParameterGroupCollapse from '@/features/tools/parameters/parameter-group-collapse'
import { groupParameters } from '@/features/tools/utils/parameters'
import { useAuthState } from '@/hooks/use-auth-state'
import { GatedActions } from '@/hooks/use-subscription-gate'
import { useSubscriptionGate } from '@/hooks/use-subscription-gate'
import { useToolPreset } from '@/hooks/use-tool-preset'
import { trackTaskCreate } from '@/lib/analytics'
import { createZodFormSchema, getDefaultNameValueMap } from '@/lib/forms'
import { cn } from '@/lib/utils'
import { calculateCost } from '@/utils/cost.util'
import { ToolV2 } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { Loader2, MenuIcon } from 'lucide-react'
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
  const { isAllowed: isAllowedPrivacy } = useSubscriptionGate(
    GatedActions.MakePrivate,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
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
  const [showSidebarButton, setShowSidebarButton] = useState(false)

  // Get sidebar context (may throw if not within SidebarLayout)
  let sidebarContext: {
    openSidebar: () => void
    isSidebarOpen: boolean
  } | null = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    sidebarContext = useSidebar()
  } catch {
    // Not within SidebarLayout context, which is fine
  }

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      const isMobile = width < 1024 // lg breakpoint - show modal on mobile/tablet
      const shouldShowSidebarButton = width < 1280 && width >= 1024 // between lg and xl - show sidebar button

      // Only close the modal if switching to desktop, never open it automatically
      if (!isMobile && mobileIsFormVisible) {
        setMobileIsFormVisible(false)
      }
      setShowSidebarButton(shouldShowSidebarButton)
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

  // console.log({ cost, hasEnoughBalance })

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

    const { makePublic, ...args } = formData as FormData & {
      makePublic?: boolean
    }
    // console.log('onSubmit', formData)
    // return

    setIsSubmitting(true)

    try {
      const response = await axios.post('/api/tasks/create', {
        tool: tool.key,
        args: args,
        makePublic: makePublic,
      })

      console.log({ response })

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

  const router = useRouter()
  const pathname = usePathname()

  const handleReset = useCallback(() => {
    router.push(pathname, { scroll: false })
    form.reset(defaultValues, { keepDefaultValues: true })
  }, [pathname])

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

  const isRunwayPoweredTool = RUNWAY_TOOL_KEYS.includes(tool.key)

  const widthParameter = tool.parameters?.find(
    parameter => parameter.name === 'width',
  )
  const heightParameter = tool.parameters?.find(
    parameter => parameter.name === 'height',
  )

  const formContent = (
    <Form {...form}>
      <form className="w-full flex flex-col justify-start h-full min-w-full">
        <div
          className={cn(
            'flex p-2 bg-secondary border border-b-gray-300 dark:border-b-gray-700',
            mobileIsFormVisible && sidebarContext && 'pl-12',
          )}
        >
          {/* Sidebar button - shown when sidebar is hidden but not on mobile/tablet modal */}
          {showSidebarButton && sidebarContext && !mobileIsFormVisible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={sidebarContext.openSidebar}
              className="p-1 h-9 w-9 mr-2 self-start flex-shrink-0"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
          )}

          <div className="flex flex-col flex-1">
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
            <div data-test-id="tool-form-settings-optional" className="mt-2">
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

        <div className="flex justify-between items-center p-3 bg-secondary border border-t-gray-300 dark:border-t-gray-700">
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
            render={({ field, fieldState }) => (
              <FormItem
                data-test-id={'makePublic'}
                className="flex items-center gap-2 space-y-0 relative"
              >
                <div className={'flex items-center gap-2'}>
                  <SubscriptionCrownBadge
                    type={tool.output_type === 'lora' ? 'model' : 'creation'}
                    className="h-5 w-5"
                  />
                  <FormControl id={field.name} className="mt-0">
                    <Switch
                      checked={field.value === undefined ? true : field.value}
                      onCheckedChange={field.onChange}
                      disabled={!isAllowedPrivacy}
                    />
                  </FormControl>
                  <FormLabel
                    htmlFor={field.name}
                    className={'text-muted-foreground !mt-0'}
                  >
                    Public
                  </FormLabel>
                </div>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <CostIndicatorV2 cost={cost} />

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
            className="w-[72px]"
            onClick={!isSubmitting ? form.handleSubmit(onSubmit) : undefined}
            disabled={
              isSubmitting ||
              !hasEnoughBalance ||
              Object.keys(form.formState.errors).length > 0
            }
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
        data-test-id="tool-form"
        className={cn([
          'flex flex-col items-start justify-start bg-muted-darker rounded-md h-full w-full',
          'hidden lg:flex',
        ])}
      >
        {formContent}
      </div>

      {/* // Mobile: hidden on larger screens */}
      <CreationUIMobile
        open={mobileIsFormVisible}
        onOpenChange={setMobileIsFormVisible}
        tool={tool}
        showSidebarButton={!!sidebarContext}
        onSidebarOpen={sidebarContext?.openSidebar}
      >
        {formContent}
      </CreationUIMobile>
    </>
  )
}

export default CreationUIContainer
