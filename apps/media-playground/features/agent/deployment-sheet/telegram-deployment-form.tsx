'use client'

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { ChannelsField } from '@/features/agent/deployment-sheet/channels-field'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { TokenField } from '@/features/agent/deployment-sheet/token-field'
import { cn } from '@/lib/utils'
import { Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  token: z.string(),
  allowedTopics: z
    .array(
      z.object({
        id: z.string().min(1, 'Topic is required'),
        note: z.string().optional(),
      }),
    )
    .min(1, 'At least one topic must be added to deploy your agent'),
})

type DeploymentFormDto = z.infer<typeof schema>

interface TelegramDeploymentFormProps {
  agentId: string
  deployment?: Deployment
  variant?: 'collapsible' | 'inline'
}

export const TelegramDeploymentForm = ({
  agentId,
  deployment,
  variant = 'collapsible',
}: TelegramDeploymentFormProps) => {
  const isInline = variant === 'inline'
  const [isOpen, setIsOpen] = useState(isInline ? true : false)

  const form = useForm<DeploymentFormDto>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: '',
      allowedTopics:
        deployment?.config?.telegram?.topic_allowlist?.map(topic => ({
          id: topic.id || '',
          note: topic.note || '',
        })) && deployment?.config?.telegram?.topic_allowlist?.length > 0
          ? deployment?.config?.telegram?.topic_allowlist?.map(topic => ({
              id: topic.id || '',
              note: topic.note || '',
            }))
          : [{ id: '', note: '' }],
    },
  })

  const isDeployed = useMemo(() => {
    return deployment !== undefined
  }, [deployment])

  const wasDeployed = useRef(isDeployed)
  useEffect(() => {
    if (isInline) return
    if (wasDeployed.current && !isDeployed) {
      setIsOpen(false)
    }
    wasDeployed.current = isDeployed
  }, [isDeployed, isInline])

  const allowedTopics = useFieldArray({
    control: form.control,
    name: 'allowedTopics',
  })

  useEffect(() => {
    if (form.formState.submitCount > 0) {
      form.trigger('allowedTopics')
    }
  }, [form.formState.submitCount, form.trigger])

  const open = isInline ? true : isOpen

  return (
    <Collapsible
      className="w-full"
      open={open}
      onOpenChange={value => {
        if (!isInline) setIsOpen(value)
      }}
    >
      <DeploymentCollapsibleTrigger
        isOpen={open}
        isDeployed={isDeployed ?? false}
        label="Telegram"
        tooltip="Deploy your agent to Telegram"
        valid={deployment?.valid}
        isStatic={isInline}
      />
      <CollapsibleContent
        className={cn([
          open
            ? 'border border-gray-400/20 border-t-0 rounded-b-lg flex flex-col gap-2'
            : '',
          isDeployed ? 'border-success' : '',
          deployment?.valid === false ? 'border-destructive' : '',
        ])}
      >
        <Form {...form}>
          <form className="flex flex-col w-full space-y-4 p-4">
            <TokenField
              form={form}
              name="token"
              isDeployed={isDeployed ?? false}
              isSubmitting={form.formState.isSubmitting}
              label="Token"
              description="Your Telegram bot token."
            />
            <FormField
              control={form.control}
              name="allowedTopics"
              render={({ fieldState }) => (
                <FormItem>
                  <ChannelsField
                    form={form}
                    name="allowedTopics"
                    type="topic"
                    allowList={allowedTopics}
                    label="Allowed Topics"
                    description="The topics your agent will be deployed to. At least one topic is required."
                  />
                  {fieldState.error && fieldState.error.message && (
                    <FormMessage>{fieldState.error.message}</FormMessage>
                  )}
                </FormItem>
              )}
            />
            <DeploymentFormFooter
              form={form}
              agentId={agentId}
              platform="telegram"
              isDeployed={isDeployed ?? false}
              valid={deployment?.valid}
              guideUrl="https://docs.eden.art/integrations/telegram"
            />
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
