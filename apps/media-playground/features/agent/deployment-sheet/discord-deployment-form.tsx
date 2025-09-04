'use client'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { ChannelsField } from '@/features/agent/deployment-sheet/channels-field'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { TokenField } from '@/features/agent/deployment-sheet/token-field'
import { cn } from '@/lib/utils'
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { Copy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
  readAccessChannels: z
    .array(
      z.object({
        id: z.string().min(1, 'Channel ID is required'),
        note: z.string().optional(),
      }),
    )
    .optional(),
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
      readAccessChannels:
        deployment?.config?.discord?.read_access_channels?.map(channel => ({
          id: channel.id || '',
          note: channel.note || '',
        })) || [],
    },
  })

  const allowedChannels = useFieldArray({
    control: form.control,
    name: 'allowedChannels',
  })

  const readAccessChannels = useFieldArray({
    control: form.control,
    name: 'readAccessChannels',
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
        valid={deployment?.valid}
      />
      <CollapsibleContent
        className={cn([
          isOpen
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

            <FormField
              control={form.control}
              name="readAccessChannels"
              render={({ fieldState }) => (
                <FormItem>
                  <ChannelsField
                    form={form}
                    name="readAccessChannels"
                    type="channel"
                    allowList={readAccessChannels}
                    label="Read Access Channels"
                    description="The channels your agent will have read-only access to. The note field should describe what the channel is for so the agent is able to find it when asked to search."
                  />
                  {fieldState.error && fieldState.error.message && (
                    <FormMessage>{fieldState.error.message}</FormMessage>
                  )}
                </FormItem>
              )}
            />

            {/* OAuth URL Section */}
            {isDeployed &&
              (deployment?.config?.discord?.oauth_url ||
                deployment?.config?.discord?.oauth_client_id ||
                deployment?.secrets?.discord?.application_id) && (
                <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-semibold">
                      Invite Bot to Server
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Add your bot to a Discord server using this invite link
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="p-3 bg-background/60 border border-border/50 rounded-md overflow-hidden">
                      <code className="text-xs text-muted-foreground block truncate">
                        {deployment?.config?.discord?.oauth_url ||
                          `https://discord.com/oauth2/authorize?client_id=${deployment?.secrets?.discord?.application_id}&permissions=274877958144&integration_type=0&scope=bot`}
                      </code>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={e => {
                          e.preventDefault()
                          const oauthUrl =
                            deployment?.config?.discord?.oauth_url ||
                            `https://discord.com/oauth2/authorize?client_id=${deployment?.secrets?.discord?.application_id}&permissions=274877958144&integration_type=0&scope=bot`

                          navigator.clipboard.writeText(oauthUrl)
                          toast.success('Copied to clipboard')
                        }}
                        className="flex-1"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Copy Link
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={e => {
                          e.preventDefault()
                          const oauthUrl =
                            deployment?.config?.discord?.oauth_url ||
                            `https://discord.com/oauth2/authorize?client_id=${deployment?.secrets?.discord?.application_id}&permissions=274877958144&integration_type=0&scope=bot`
                          window.open(oauthUrl, '_blank')
                        }}
                        className="flex-1"
                      >
                        Open Invite Link
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            <DeploymentFormFooter
              agentId={agentId}
              platform="discord"
              form={form}
              isDeployed={isDeployed ?? false}
              guideUrl="https://docs.eden.art/docs/guides/discord"
              valid={deployment?.valid}
            />
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
