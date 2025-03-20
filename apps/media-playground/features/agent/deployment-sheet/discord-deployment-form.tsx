'use client'

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { ChannelsField } from '@/features/agent/deployment-sheet/channels-field'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { TokenField } from '@/features/agent/deployment-sheet/token-field'
import { cn } from '@/lib/utils'
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
  token: z.string(),
  allowedChannels: z
    .array(
      z.object({
        id: z.string().min(1, 'Channel ID is required'),
        note: z.string().optional(),
      }),
    )
    .min(1, 'At least one channel must be added to deploy your agent'),
})

type DeploymentFormDto = z.infer<typeof schema>

interface DiscordDeploymentFormProps {
  agentId: Agent['_id']
  deployment?: Deployment
}

export const DiscordDeploymentForm = ({
  agentId,
  deployment,
}: DiscordDeploymentFormProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<DeploymentFormDto>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: '',
      allowedChannels:
        deployment?.config?.discord?.channel_allowlist?.map(channel => ({
          id: channel.id || '',
          note: channel.note || '',
        })) && deployment?.config?.discord?.channel_allowlist?.length > 0
          ? deployment?.config?.discord?.channel_allowlist?.map(channel => ({
              id: channel.id || '',
              note: channel.note || '',
            }))
          : [{ id: '', note: '' }],
    },
  })

  const allowedChannels = useFieldArray({
    control: form.control,
    name: 'allowedChannels',
  })

  const isDeployed = useMemo(() => {
    return deployment !== undefined
  }, [deployment])

  useEffect(() => {
    if (form.formState.submitCount > 0) {
      form.trigger('allowedChannels')
    }
  }, [form.formState.submitCount, form.trigger])

  return (
    <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
      <DeploymentCollapsibleTrigger
        isOpen={isOpen}
        isDeployed={isDeployed ?? false}
        label="Discord"
        tooltip="Deploy your agent to Discord"
      />
      <CollapsibleContent
        className={cn([
          isOpen
            ? 'border border-gray-400/20 border-t-0 rounded-b-lg flex flex-col gap-2'
            : '',
          isDeployed ? 'border-success' : '',
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
              description="Your Discord bot token."
            />
            <FormField
              control={form.control}
              name="allowedChannels"
              render={({ fieldState }) => (
                <FormItem>
                  <ChannelsField
                    form={form}
                    name="allowedChannels"
                    type="channel"
                    allowList={allowedChannels}
                    label="Allowed Channels"
                    description="The channels your agent will be deployed to. At least one channel is required."
                  />
                  {fieldState.error && fieldState.error.message && (
                    <FormMessage>{fieldState.error.message}</FormMessage>
                  )}
                </FormItem>
              )}
            />
            <DeploymentFormFooter
              agentId={agentId}
              platform="discord"
              form={form}
              isDeployed={isDeployed ?? false}
              guideUrl="https://docs.eden.art/docs/guides/discord"
            />
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
