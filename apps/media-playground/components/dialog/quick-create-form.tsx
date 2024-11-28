import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import CostIndicatorV2 from '@/features/tools/cost-indicator-v2'
import ParameterField from '@/features/tools/parameters/parameter-field'
import { useToolQuery } from '@/hooks/query/use-tool-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { createZodFormSchema, getDefaultNameValueMap } from '@/lib/forms'
import { ToolV2 } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const SimpleGeneratorForm = ({
  generator,
  exposedParameters,
  initValues,
  onSubmitSuccess,
}: {
  generator: ToolV2
  exposedParameters: string[]
  initValues: { [key: string]: string | number }
  onSubmitSuccess: () => void
}) => {
  const { verifyAuth, refetchMe } = useAuthState()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const parameters = generator?.parameters?.filter(param =>
    exposedParameters.includes(param.name),
  )
  const parameterSchema = createZodFormSchema(parameters || [])
  type FormData = z.infer<typeof parameterSchema>
  const defaultValues: FormData | undefined = getDefaultNameValueMap(
    generator?.parameters,
  )
  const form = useForm<FormData>({
    resolver: zodResolver(parameterSchema), // use generated form schema for resolver
    defaultValues: { ...defaultValues, ...initValues },
  })

  async function onSubmit(formData: FormData) {
    const finalData = { ...defaultValues, ...formData, ...initValues }
    // console.log('onSubmit', finalData)

    if (!(await verifyAuth())) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await axios.post('/api/tasks/create', {
        tool: generator.key,
        args: finalData,
      })

      console.log({ response })

      toast.success(`Task submitted`, {
        description: (
          <code className="text-xs text-foreground">Tool: {generator.key}</code>
        ),
        dismissible: true,
        richColors: true,
      })

      onSubmitSuccess()

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

  return (
    <Form {...form}>
      <form className="w-full">
        {generator && parameters && parameters.length
          ? parameters.map(param => {
              return (
                <ParameterField
                  form={form}
                  className={'bg-muted rounded-md mb-4'}
                  key={param.name}
                  tool={generator}
                  parameter={param}
                />
              )
            })
          : null}
        <div className="flex gap-2 items-center justify-end">
          <CostIndicatorV2 formula={generator.cost_estimate} />
          <Button
            type="button"
            className=" w-[72px]"
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
}

const QuickCreateForm = ({
  toolKey,
  exposedParameters,
  initValues,
  onSubmitSuccess,
}: {
  toolKey: string
  exposedParameters: string[]
  initValues: { [key: string]: string | number }
  onSubmitSuccess: () => void
}) => {
  const { generator } = useToolQuery({ key: toolKey })

  if (!generator) {
    return null
  }

  return (
    <div className="p-4 bg-muted-darker rounded-b-md">
      <div className="text-xs text-muted-foreground mb-4">
        {generator.description}
      </div>
      <SimpleGeneratorForm
        generator={generator}
        exposedParameters={exposedParameters}
        initValues={initValues}
        onSubmitSuccess={onSubmitSuccess}
      />
    </div>
  )
}

export default QuickCreateForm
