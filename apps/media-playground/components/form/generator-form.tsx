'use client'

import AspectRatioSelector from '@/components/form/aspect-ratio-selector'
import FormItemHead from '@/components/form/form-item-head'
import FormItemWrap from '@/components/form/form-item-wrap'
import SelectInput from '@/components/form/input/select-input'
import SliderInput from '@/components/form/input/slider-input'
import ModelSelector from '@/components/form/model-input'
import FileUploader from '@/components/media/file-uploader'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import TypographyH3 from '@/components/ui/typography/TypographyH3'
import { useAuthState } from '@/hooks/use-auth-state'
import { createZodFormSchema } from '@/lib/forms'
import { cn } from '@/lib/utils'
import { GeneratorParameterV2, GeneratorV2 } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { Loader2, Settings2Icon } from 'lucide-react'
import { useCallback, useState } from 'react'
import { UseFormReturn, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

// import FormPersist from '@/components/form-persist'

type Props = {
  generator: GeneratorV2
}

const renderFormField = (
  parameter: GeneratorParameterV2,
  form: UseFormReturn,
) => {
  const { name, label } = parameter
  return (
    <FormField
      name={name}
      render={({ field, fieldState }) => {
        const { onChange, onBlur, value, name } = field
        let parsedValue: number | string | ''
        switch (parameter.type) {
          case 'int':
            parsedValue = Number(value)
            if (isNaN(parsedValue)) {
              parsedValue = ''
            }

            return (
              <FormItemWrap
                name={name}
                label={label}
                description={parameter.description}
                errorMessage={fieldState.error?.message}
              >
                {parameter.name === 'seed' ? (
                  <Input
                    type="number"
                    onChange={e =>
                      onChange(
                        e.target.value ? parseInt(e.target.value) : undefined,
                      )
                    }
                    onBlur={onBlur}
                    value={parsedValue}
                  />
                ) : (
                  <SliderInput
                    type={parameter.type}
                    form={form}
                    min={parameter.minimum || 0}
                    max={parameter.maximum || 1}
                    step={parameter.step ? parameter.step : 1}
                    value={value}
                    onChange={onChange}
                  />
                )}
              </FormItemWrap>
            )
          case 'float':
            return (
              <FormItemWrap
                name={name}
                label={label}
                description={parameter.description}
                errorMessage={fieldState.error?.message}
              >
                <SliderInput
                  form={form}
                  type={parameter.type}
                  min={parameter.minimum || 0}
                  max={parameter.maximum || 1}
                  step={parameter.step ? parameter.step : 0.05}
                  value={value}
                  onChange={newVal => {
                    onChange(newVal)
                  }}
                />
              </FormItemWrap>
            )
          case 'bool':
            return (
              <FormItem className="flex flex-row items-center justify-between rounded-lg p-4">
                <FormItemHead
                  label={label}
                  description={parameter.description}
                />
                <FormControl id={name} className="ml-4">
                  <Switch
                    checked={value}
                    onCheckedChange={checked => onChange(checked)}
                  />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )
          case 'string':
          case 'string[]':
            return name === 'prompt' ||
              name === 'negative_prompt' ||
              name === 'text_input' ? (
              <FormItem
                className={`mt-0 !p-4 ${
                  parameter.required ? '!pt-4' : '!pt-3'
                }`}
              >
                {parameter.required ? (
                  <FormLabel className="sr-only">{label}</FormLabel>
                ) : (
                  <FormItemHead
                    label={label}
                    description={parameter.description}
                  />
                )}
                <FormControl id={name}>
                  <Textarea
                    autoResize={true}
                    spellCheck={false}
                    placeholder={parameter.description}
                    className={`!mt-0 !ml-0 border-0 resize-none overflow-hidden rounded-lg ${
                      parameter.required
                        ? '!outline-none !p-4 !pt-3'
                        : 'rounded-lg border p-2 '
                    }`}
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value || ''}
                  />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            ) : (
              <FormItemWrap
                name={name}
                label={label}
                description={parameter.description}
                errorMessage={fieldState.error?.message}
              >
                {parameter.choices && parameter.choices.length ? (
                  <SelectInput
                    placeholder={label}
                    onChange={onChange}
                    value={value}
                    options={parameter.choices}
                  />
                ) : (
                  <Input
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value === null ? '' : value}
                  />
                )}
              </FormItemWrap>
            )
          case 'lora':
            parsedValue = typeof value !== 'string' ? '' : value
            return (
              <FormItem className="mt-0 !p-4 !pt-3">
                <FormItemHead
                  label={label}
                  description={parameter.description}
                />
                <FormControl id={name}>
                  <Input
                    className={'hidden'}
                    onChange={onChange}
                    onBlur={onBlur}
                    value={parsedValue}
                  />
                </FormControl>
                <ModelSelector
                  form={form}
                  value={parsedValue}
                  onChange={onChange}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )
          case 'image':
            return (
              <FormItem className="mt-0 !p-4 !pt-3">
                <FormItemHead
                  label={label}
                  description={parameter.description}
                />
                <FormControl id={name}>
                  <Input
                    className={'hidden'}
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value === null ? '' : value || ''}
                  />
                </FormControl>
                <FileUploader
                  value={value === null ? [] : value || ''}
                  onChange={onChange}
                  allowedFileTypes={['image']}
                  maxFiles={1}
                  allowMultiple={false}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )
          case 'image[]':
            return (
              <FormItem className="mt-0 !p-4 !pt-3">
                <FormItemHead
                  label={label}
                  description={parameter.description}
                />
                <FormControl id={name}>
                  <Input
                    className={'hidden'}
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value === null ? '' : value || ''}
                  />
                </FormControl>
                <FileUploader
                  value={value === null ? [] : value || []}
                  onChange={onChange}
                  allowedFileTypes={['image']}
                  maxFiles={
                    parameter.max_length === null ||
                    parameter.max_length === undefined
                      ? 128
                      : parameter.max_length || 1
                  }
                  allowMultiple={true}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )
          case 'video':
            return (
              <FormItem className="mt-0 !p-4 !pt-3">
                <FormItemHead
                  label={label}
                  description={parameter.description}
                />
                <FormControl id={name}>
                  <Input
                    className={'hidden'}
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value === null ? '' : value}
                  />
                </FormControl>
                <FileUploader
                  value={value === null ? [] : value}
                  onChange={onChange}
                  allowedFileTypes={['video']}
                  maxFiles={1}
                  allowMultiple={false}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )
          case 'video[]':
            return (
              <FormItem className="mt-0 !p-4 !pt-3">
                <FormItemHead
                  label={label}
                  description={parameter.description}
                />
                <FormControl id={name}>
                  <Input
                    className={'hidden'}
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value === null ? '' : value}
                  />
                </FormControl>
                <FileUploader
                  value={value === null ? [] : value}
                  onChange={onChange}
                  allowedFileTypes={['video']}
                  maxFiles={
                    parameter.max_length === null ||
                    parameter.max_length === undefined
                      ? 128
                      : parameter.max_length || 1
                  }
                  allowMultiple={parameter.max_length !== 1}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )
          default:
            return (
              <FormItemWrap
                name={name}
                label={label}
                description={parameter.description}
                errorMessage={fieldState.error?.message}
              >
                <Input
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value === null ? '' : value}
                />
              </FormItemWrap>
            )
        }
      }}
    />
  )
}

const GeneratorForm = ({ generator }: Props) => {
  const { verifyAuth } = useAuthState()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultValues = generator.parameters?.reduce((accum, currParameter) => {
    return {
      ...accum,
      [currParameter.name]: currParameter.default,
    }
  }, {})

  // console.log({defaultValues})

  const hasAspectRatioSelector = generator.parameters?.some(
    param => param.name === 'width' || param.name === 'height',
  )

  // console.log({ hasAspectRatioSelector })

  const parameterSchema = createZodFormSchema(generator.parameters || []) // create form schema

  type FormData = z.infer<typeof parameterSchema>

  const form = useForm<FormData>({
    resolver: zodResolver(parameterSchema), // use generated form schema for resolver
    defaultValues,
  })

  async function onSubmit(formData: z.infer<typeof parameterSchema>) {
    // console.log('try onSubmit', formData)
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

      toast.info(`Task submitted`, {
        description: (
          <code className=" text-xs text-foreground">
            Workflow: {generator.key}
          </code>
        ),
        dismissible: true,
        richColors: true,
      })
    } catch (err) {
      console.log(err)
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

  const [showForm, setShowForm] = useState(false)
  // const [resetKey, setResetKey] = useState(0)

  // console.log({defaultValues})

  const handleReset = useCallback(() => {
    console.log('handleReset tap reset key')
    form.reset(defaultValues, { keepDefaultValues: true })
    // setResetKey(prev => prev + 1)
    //
    // setTimeout(() => {
    //   console.log('before reset', {defaultValues})
    //   form.reset(defaultValues, { keepDefaultValues: true })
    // }, 100)
  }, [])

  const requiredParameters = generator.parameters?.filter(
    parameter => parameter.required,
  )
  const otherParameters = generator.parameters?.filter(
    parameter => !parameter.required,
  )

  return (
    <div
      data-test-id="generator-form"
      className="flex flex-col items-start overflow-y-auto xl:pr-4 xl:sticky xl:top-[106px] xl:max-h-[calc(100vh_-_106px)]"
    >
      {/*<FormPersist resetKey={resetKey} formKey={`form_tool_${generator.key}`} form={form} defaultValues={defaultValues}/>*/}
      <Form {...form}>
        <form className="flex flex-col w-full">
          <TypographyH3>{generator.name}</TypographyH3>
          <div
            data-test-id="generator-form-settings-required"
            className="flex flex-col gap-2"
          >
            {requiredParameters?.map(parameter => (
              <div key={parameter.name} className="bg-muted/60 rounded-lg">
                {renderFormField(parameter, form)}
              </div>
            ))}
            {hasAspectRatioSelector ? (
              <div className="flex justify-end">
                <AspectRatioSelector form={form} />
              </div>
            ) : null}
          </div>

          <div className="flex gap-4 my-2">
            {otherParameters?.length ? (
              <Button
                type="button"
                variant="secondary"
                className="flex items-center gap-2"
                onClick={() => setShowForm(!showForm)}
              >
                <Settings2Icon className="h-4 w-4" />
                Settings
              </Button>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground"
              onClick={!isSubmitting ? handleReset : undefined}
              disabled={isSubmitting}
            >
              Reset
            </Button>

            <Button
              type="button"
              className="ml-auto"
              onClick={!isSubmitting ? form.handleSubmit(onSubmit) : undefined}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                <>Create</>
              )}
            </Button>
          </div>
          {otherParameters?.length ? (
            <div
              data-test-id="generator-form-settings-optional"
              className={cn([showForm ? '' : 'overflow-hidden'])}
            >
              <div
                className={cn([
                  'flex flex-col gap-2 w-full relative transition-all',
                  showForm ? ' mb-4' : 'max-h-0 ',
                ])}
              >
                {otherParameters?.map(parameter => (
                  <div key={parameter.name} className="bg-muted/50 rounded-lg">
                    {renderFormField(parameter, form)}
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
