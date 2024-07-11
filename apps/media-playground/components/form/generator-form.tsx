'use client'

// import ImageStyleSelector, {
//   ImageStyle,
// } from '@/components/form/image-style-selector'
import SettingsFormDrawer from '@/components/form/settings-form-drawer'
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
import { useToast } from '@/components/ui/use-toast'
import { useAuthState } from '@/hooks/use-auth-state'
import { createZodFormSchema } from '@/lib/forms'
import { GeneratorParameterV2, GeneratorV2 } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

type Props = {
  generator: GeneratorV2
}

const renderFormField = (parameter: GeneratorParameterV2) => {
  const { name, label } = parameter
  return (
    <FormField
      name={name}
      render={({ field, fieldState }) => {
        const { onChange, onBlur, value } = field
        switch (parameter.type) {
          case 'int':
          case 'float':
            return (
              <FormItem className="mt-0 !px-4 !py-3">
                <FormLabel>{label}</FormLabel>
                <FormControl id={field.name}>
                  <Input
                    type="number"
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value || parameter.default || 0}
                  />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )
          case 'boolean':
            return (
              <FormItem className="mt-0 !px-4 !py-3">
                <FormLabel>{label}</FormLabel>
                <FormControl id={field.name}>
                  <Switch
                    checked={value}
                    onChange={e =>
                      onChange((e.target as HTMLInputElement).checked)
                    }
                  />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )
          case 'string':
            return field.name === 'prompt' ? (
              <FormItem className="mt-0 !px-4 !py-3">
                <FormLabel className="sr-only">{label}</FormLabel>
                <FormControl>
                  <Textarea
                    autoResize={true}
                    spellCheck={false}
                    placeholder={parameter.description}
                    className="!mt-0 !ml-0 !px-0 !py-0 resize-none border-0 !outline-0 !outline-none !ring-0 overflow-hidden rounded-none"
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value || parameter.default || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            ) : (
              <FormItem className="mt-0 !px-4 !py-3">
                <FormLabel>{label}</FormLabel>
                <FormControl id={field.name}>
                  <Input
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value || parameter.default || ''}
                  />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )
          default:
            return (
              <FormItem className="mt-0 !px-4 !py-3">
                <FormLabel>{label}</FormLabel>
                <FormControl id={field.name}>
                  <Input
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value || parameter.default || ''}
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
  // const [imageStyles, setImageStyles] = useState<ImageStyle[]>([])
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

      toast({
        className: 'flex p-4',
        title: 'Task submitted',
        description: (
          <div className="mt-2 rounded-md bg-popover p-2">
            <code className=" text-xs text-foreground">
              Workflow: {generator.key}
              {/*{JSON.stringify(formData, null, 2)}*/}
            </code>
          </div>
        ),
        // action: <ToastAction altText="Go to task">Show Task</ToastAction>,
      })
    } catch (err) {
      console.log(err)
      const errorMessage = axios.isAxiosError(err)
        ? JSON.parse((err as AxiosError).request.responseText)?.message
        : 'Unknown Error'
      toast({
        className: 'flex p-4 text-red-600',
        title: 'Failed to submit task',
        description: (
          <div className="rounded-md text-primary">
            {JSON.stringify(errorMessage)}
          </div>
        ),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-start">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full sticky top-20 flex flex-col gap-2"
        >
          <TypographyH3>{generator.name}</TypographyH3>
          {generator.parameters?.map(parameter => (
            <div
              key={parameter.name}
              className="bg-popover rounded-lg overflow-hidden"
            >
              {renderFormField(parameter)}
              {/*<ImageStyleSelector*/}
              {/*  onChange={selectedStyles => setImageStyles(selectedStyles)}*/}
              {/*/>*/}
              {/*{imageStyles && imageStyles.length ? (*/}
              {/*  <div className="text-xs">*/}
              {/*    debug: selected styles*/}
              {/*    <pre>{JSON.stringify(imageStyles, null, 2)}</pre>*/}
              {/*  </div>*/}
              {/*) : null}*/}
            </div>
          ))}

          <div className="flex gap-4 mt-4">
            <SettingsFormDrawer />

            <Button type="submit" className="ml-auto" disabled={isSubmitting}>
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
        </form>
      </Form>
    </div>
  )
}

export default GeneratorForm
