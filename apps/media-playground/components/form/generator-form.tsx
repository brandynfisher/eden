'use client'

import SelectInput from '@/components/form/select-input'
import SliderInput from '@/components/form/slider-input'
import FileUploader from '@/components/media/file-uploader'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import TypographyH3 from '@/components/ui/typography/TypographyH3'
import { useToast } from '@/components/ui/use-toast'
import { useAuthState } from '@/hooks/use-auth-state'
import { createZodFormSchema } from '@/lib/forms'
import { getToastConfig } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { GeneratorParameterV2, GeneratorV2 } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { Loader2, Settings2Icon } from 'lucide-react'
import { useState } from 'react'
import { UseFormReturn, useForm } from 'react-hook-form'
import { z } from 'zod'

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
        let parsedValue: number | undefined
        switch (parameter.type) {
          case 'int':
            parsedValue = Number(value)
            if (isNaN(parsedValue)) {
              parsedValue = undefined
            }

            return (
              <FormItem className="mt-0 !p-4 !pt-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">{label}</FormLabel>
                  <FormDescription>{parameter.description}</FormDescription>
                </div>
                <FormControl id={name}>
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
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )
          case 'float':
            parsedValue = Number(value)
            if (isNaN(parsedValue)) {
              parsedValue = undefined
            }

            return (
              <FormItem className="mt-0 !p-4 !pt-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">{label}</FormLabel>
                  <FormDescription>{parameter.description}</FormDescription>
                </div>
                <FormControl id={name}>
                  <SliderInput
                    form={form}
                    min={parameter.minimum || 0}
                    max={parameter.maximum || 1}
                    step={0.1}
                    value={value}
                    onChange={newVal => {
                      onChange(newVal)
                    }}
                  />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )
          case 'bool':
            return (
              <FormItem className="flex flex-row items-center justify-between rounded-lg p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">{label}</FormLabel>
                  <FormDescription>{parameter.description}</FormDescription>
                </div>
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
            return name === 'prompt' || name === 'negative_prompt' ? (
              <FormItem
                className={`mt-0 !p-4 ${parameter.required ? '!pt-4' : '!pt-3'}`}
              >
                {parameter.required ? (
                  <FormLabel className="sr-only">{label}</FormLabel>
                ) : (
                  <div className="space-y-0.5 mb-2">
                    <FormLabel className="text-base capitalize">
                      {label}
                    </FormLabel>
                    <FormDescription>{parameter.description}</FormDescription>
                  </div>
                )}
                <FormControl>
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
                <FormMessage />
              </FormItem>
            ) : (
              <FormItem className="mt-0 !p-4 !pt-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base capitalize">
                    {label}
                  </FormLabel>
                  <FormDescription>{parameter.description}</FormDescription>
                </div>
                <FormControl id={name}>
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
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )
          case 'image':
            return (
              <FormItem className="mt-0 !p-4 !pt-3">
                <div className="space-y-0.5">
                  <FormLabel className="capitalize">{label}</FormLabel>
                  <FormDescription>{parameter.description}</FormDescription>
                </div>
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
                <div className="space-y-0.5">
                  <FormLabel className="capitalize">{label}</FormLabel>
                  <FormDescription>{parameter.description}</FormDescription>
                </div>
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
                <div className="space-y-0.5">
                  <FormLabel className="capitalize">{label}</FormLabel>
                  <FormDescription>{parameter.description}</FormDescription>
                </div>
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
                <div className="space-y-0.5">
                  <FormLabel className="capitalize">{label}</FormLabel>
                  <FormDescription>{parameter.description}</FormDescription>
                </div>
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
              <FormItem className="mt-0 !p-4 !pt-3">
                <div className="space-y-0.5">
                  <FormLabel className="capitalize">{label}</FormLabel>
                  <FormDescription>{parameter.description}</FormDescription>
                </div>
                <FormControl id={name}>
                  <Input
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value === null ? '' : value}
                  />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )
        }
      }}
    />
  )
}

const GeneratorForm = ({ generator }: Props) => {
  const { verifyAuth } = useAuthState()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const parameterSchema = createZodFormSchema(generator.parameters || []) // create form schema
  const form = useForm({
    resolver: zodResolver(parameterSchema), // use generated form schema for resolver
    defaultValues: generator.parameters?.reduce((accum, currParameter) => {
      return {
        ...accum,
        [currParameter.name]: currParameter.default,
      }
    }, {}),
  })

  const { toast } = useToast()

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

      toast(
        getToastConfig(
          'Task submitted',
          <code className=" text-xs text-foreground">
            Workflow: {generator.key}
          </code>,
          'success',
        ),
      )
    } catch (err) {
      console.log(err)
      const errorMessage = axios.isAxiosError(err)
        ? JSON.parse((err as AxiosError).request.responseText)?.message
        : 'Unknown Error'

      toast(
        getToastConfig(
          'Failed to submit task',
          JSON.stringify(errorMessage),
          'error',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const [showForm, setShowForm] = useState(false)

  return (
    <div
      data-test-id="generator-form"
      className="flex flex-col items-start overflow-y-auto xl:pr-4 xl:sticky xl:top-[106px] xl:max-h-[calc(100vh_-_106px)]"
    >
      <Form {...form}>
        <form className="flex flex-col w-full">
          <TypographyH3>{generator.name}</TypographyH3>
          <div
            data-test-id="generator-form-settings-required"
            className="flex flex-col gap-4"
          >
            {generator.parameters
              ?.filter(parameter => parameter.required)
              ?.map(parameter => (
                <div key={parameter.name} className="bg-muted/60 rounded-lg">
                  {renderFormField(parameter, form)}
                </div>
              ))}
          </div>

          <div className="flex gap-4 mt-4 mb-4">
            <Button
              type="button"
              variant="secondary"
              className="flex items-center gap-2"
              onClick={() => setShowForm(!showForm)}
            >
              <Settings2Icon className="h-4 w-4" />
              Settings
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground"
              onClick={!isSubmitting ? () => form.reset() : undefined}
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
              {generator.parameters
                ?.filter(parameter => !parameter.required)
                ?.map(parameter => (
                  <div key={parameter.name} className="bg-muted/50 rounded-lg">
                    {renderFormField(parameter, form)}
                  </div>
                ))}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default GeneratorForm
