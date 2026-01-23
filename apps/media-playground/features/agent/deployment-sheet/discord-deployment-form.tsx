'use client'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { DiscordChannelSelector } from '@/features/agent/deployment-sheet/discord-channel-selector'
import { TokenField } from '@/features/agent/deployment-sheet/token-field'
import { useSyncDiscordSessions } from '@/hooks/mutation/use-sync-discord-sessions'
import { cn } from '@/lib/utils'
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, PlusIcon, RefreshCw, TrashIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const schema = z.object({
  token: z.string(),
  channels: z.array(
    z.object({
      id: z.string().min(1, 'Channel ID is required'),
      note: z.string().optional(),
      readOnly: z.boolean().optional(),
    }),
  ),
  dmUserAllowlist: z.array(
    z.object({
      id: z.string().min(1, 'User ID is required'),
      note: z.string().optional(),
    }),
  ),
  useManualEntry: z.boolean().optional(),
})

type DeploymentFormDto = z.infer<typeof schema>

interface DiscordDeploymentFormProps {
  agentId: Agent['_id']
  deployment?: Deployment
  variant?: 'collapsible' | 'inline'
}

export const DiscordDeploymentForm = ({
  agentId,
  deployment,
  variant = 'collapsible',
}: DiscordDeploymentFormProps) => {
  const isInline = variant === 'inline'
  const [isOpen, setIsOpen] = useState(isInline ? true : false)

  // Merge allowed channels and read-only channels into a unified list
  const getInitialChannels = () => {
    const allowedChannels =
      deployment?.config?.discord?.channel_allowlist?.map(channel => ({
        id: channel.id || '',
        note: channel.note || '',
        readOnly: false,
      })) || []

    const readOnlyChannels =
      deployment?.config?.discord?.read_access_channels?.map(channel => ({
        id: channel.id || '',
        note: channel.note || '',
        readOnly: true,
      })) || []

    const merged = [...allowedChannels, ...readOnlyChannels]
    return merged.length > 0 ? merged : [{ id: '', note: '', readOnly: false }]
  }

  const getInitialDmUserAllowlist = () => {
    const dmUsers =
      deployment?.config?.discord?.dm_user_allowlist?.map(user => ({
        id: user.id || '',
        note: user.note || '',
      })) || []
    return dmUsers
  }

  const form = useForm<DeploymentFormDto>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: '',
      channels: getInitialChannels(),
      dmUserAllowlist: getInitialDmUserAllowlist(),
      useManualEntry: false,
    },
  })

  const useManualEntry = form.watch('useManualEntry')
  const syncMutation = useSyncDiscordSessions(agentId)

  const channels = useFieldArray({
    control: form.control,
    name: 'channels',
  })

  const dmUserAllowlist = useFieldArray({
    control: form.control,
    name: 'dmUserAllowlist',
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

  useEffect(() => {
    if (form.formState.submitCount > 0) {
      form.trigger('channels')
    }
  }, [form, form.formState.submitCount, form.trigger])

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
        label="Discord"
        tooltip="Deploy your agent to Discord"
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
          <div className="flex flex-col w-full space-y-4 p-4">
            <TokenField
              form={form}
              name="token"
              isDeployed={isDeployed ?? false}
              isSubmitting={form.formState.isSubmitting}
              label="Token"
              description="Your Discord bot token."
            />
            {/* Channel Selection Section */}
            <div className="space-y-4 mt-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Channels</h4>
                  <FormField
                    control={form.control}
                    name="useManualEntry"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          Manual entry
                        </span>
                      </FormItem>
                    )}
                  />
                </div>
                <FormDescription>
                  The channels your agent will have access to. Toggle write
                  access for channels where the agent should respond.
                </FormDescription>
              </div>

              {useManualEntry ? (
                /* Manual Entry Mode */
                <FormField
                  control={form.control}
                  name="channels"
                  render={({ fieldState }) => (
                    <FormItem>
                      <div className="space-y-4">
                        {channels.fields.map((field, index) => (
                          <div
                            key={field.id}
                            className="flex gap-2 items-start"
                          >
                            <FormField
                              control={form.control}
                              name={`channels.${index}.id`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input
                                      placeholder="Channel ID"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`channels.${index}.note`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input
                                      placeholder="Note (optional)"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`channels.${index}.readOnly`}
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-2 pt-2">
                                  <FormControl>
                                    <Switch
                                      checked={field.value ?? false}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    Read-only
                                  </span>
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => channels.remove(index)}
                              className="flex-shrink-0"
                              disabled={channels.fields.length <= 1}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            channels.append({
                              id: '',
                              note: '',
                              readOnly: false,
                            })
                          }
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                      {fieldState.error && fieldState.error.message && (
                        <FormMessage>{fieldState.error.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />
              ) : (
                /* Channel Selector Mode */
                <DiscordChannelSelector
                  agentId={agentId}
                  selectedChannels={form.watch('channels').filter(c => c.id)}
                  onChannelsChange={newChannels => {
                    // Use useFieldArray's replace method to properly sync with form state
                    channels.replace(newChannels)
                  }}
                  isDeployed={isDeployed}
                />
              )}
            </div>

            {/* Sync Sessions Button */}
            {isDeployed && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="w-full"
              >
                <RefreshCw
                  className={cn(
                    'h-4 w-4 mr-2',
                    syncMutation.isPending && 'animate-spin',
                  )}
                />
                Sync Sessions
              </Button>
            )}

            {/* DM User Allowlist Section */}
            <div className="space-y-4 mt-4">
              <div className="flex flex-col gap-2">
                <h4 className="text-sm font-medium">DM User Allowlist</h4>
                <FormDescription>
                  Discord user IDs that can interact with your agent via direct
                  messages. Leave empty to disable DMs.
                </FormDescription>
              </div>

              <FormField
                control={form.control}
                name="dmUserAllowlist"
                render={({ fieldState }) => (
                  <FormItem>
                    <div className="space-y-4">
                      {dmUserAllowlist.fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-start">
                          <FormField
                            control={form.control}
                            name={`dmUserAllowlist.${index}.id`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input placeholder="User ID" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`dmUserAllowlist.${index}.note`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input
                                    placeholder="Note (optional)"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => dmUserAllowlist.remove(index)}
                            className="flex-shrink-0"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          dmUserAllowlist.append({
                            id: '',
                            note: '',
                          })
                        }
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </div>
                    {fieldState.error && fieldState.error.message && (
                      <FormMessage>{fieldState.error.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />
            </div>

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
                    <div className="p-3 bg-background/60 border border-border/50 rounded-md overflow-x-auto max-w-full">
                      <code className="text-xs text-muted-foreground block break-all whitespace-pre-wrap">
                        {deployment?.config?.discord?.oauth_url ||
                          `https://discord.com/oauth2/authorize?client_id=${deployment?.secrets?.discord?.application_id}&permissions=274877958144&integration_type=0&scope=bot`}
                      </code>
                    </div>
                    <div className="flex gap-2 flex-col sm:flex-row">
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
              guideUrl="https://docs.eden.art/integrations/discord"
              valid={deployment?.valid}
            />
          </div>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
