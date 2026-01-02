'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { cn } from '@/lib/utils'
import { Agent, Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { ExternalLink, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const schema = z.object({
  guildId: z.string().min(1, 'Server is required'),
  channels: z
    .array(
      z.object({
        channelId: z.string(),
        channelName: z.string(),
        access: z.enum(['read_write', 'read_only']),
      }),
    )
    .min(1, 'At least one channel is required'),
})

type DiscordV3FormDto = z.infer<typeof schema>

interface DiscordGuild {
  id: string
  name: string
  icon?: string
  owner: boolean
  has_eden_bot: boolean
}

interface DiscordChannel {
  id: string
  name: string
  type: number
}

interface DiscordV3DeploymentFormProps {
  agentId: Agent['_id']
  deployment?: Deployment
}

const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
const BOT_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=123211940928&integration_type=0&scope=bot`

export const DiscordV3DeploymentForm = ({
  agentId,
  deployment,
}: DiscordV3DeploymentFormProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [hasCompletedOAuth, setHasCompletedOAuth] = useState(false)
  const popupRef = useRef<Window | null>(null)

  const [availableServers, setAvailableServers] = useState<DiscordGuild[]>([])
  const [availableChannels, setAvailableChannels] = useState<DiscordChannel[]>(
    [],
  )
  const [isLoadingChannels, setIsLoadingChannels] = useState(false)

  const form = useForm<DiscordV3FormDto>({
    resolver: zodResolver(schema),
    defaultValues: {
      guildId: '',
      channels: [],
    },
  })

  const selectedGuildId = form.watch('guildId')

  const isDeployed = useMemo(() => {
    return deployment !== undefined
  }, [deployment])

  const wasDeployed = useRef(isDeployed)
  useEffect(() => {
    if (wasDeployed.current && !isDeployed) {
      setIsOpen(false)
    }
    wasDeployed.current = isDeployed
  }, [isDeployed])

  const cleanupPopup = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
    }
    popupRef.current = null
    setIsConnecting(false)
  }, [])

  // Load channels when guild is selected
  useEffect(() => {
    if (selectedGuildId) {
      loadChannels(selectedGuildId)
    }
  }, [selectedGuildId])

  // Listen for OAuth callback postMessage
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (
        !event.data ||
        typeof event.data !== 'object' ||
        event.data.type !== 'discord-v3-config'
      ) {
        return
      }

      cleanupPopup()

      if (event.data.success) {
        const guilds = event.data.guilds || []
        setHasCompletedOAuth(true)
        setAvailableServers(guilds)

        toast.success('Discord connected', {
          description: `Found ${guilds.length} server${
            guilds.length !== 1 ? 's' : ''
          }`,
        })

        setIsOpen(true)
      } else {
        toast.error(event.data.message ?? 'Failed to connect Discord account')
      }
    }

    const interval = window.setInterval(() => {
      if (popupRef.current && popupRef.current.closed) {
        cleanupPopup()
      }
    }, 500)

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
      window.clearInterval(interval)
      cleanupPopup()
    }
  }, [cleanupPopup])

  const handleConnectDiscord = async () => {
    setIsConnecting(true)

    const clientId = DISCORD_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/deployments/discord/oauth/callback`
    const scope = 'guilds'

    // Use same encoding as discord-auth-button
    const statePayload = JSON.stringify({
      agent_id: agentId,
      mode: 'popup',
    })

    const oauthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&response_type=code&scope=${scope}&state=${encodeURIComponent(
      statePayload,
    )}`

    const popup = window.open(
      oauthUrl,
      'discord-v3-oauth',
      'width=500,height=700',
    )

    if (!popup) {
      // Popup blocked – fall back to redirect
      window.location.href = oauthUrl
      return
    }

    popupRef.current = popup
  }

  const loadChannels = async (guildId: string) => {
    try {
      setIsLoadingChannels(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/deployments/discord/guilds/${guildId}/channels`,
      )

      if (!response.ok) {
        throw new Error('Failed to load channels')
      }

      const data = await response.json()
      setAvailableChannels(data.channels || [])
    } catch (error) {
      toast.error('Failed to load channels')
      setAvailableChannels([])
    } finally {
      setIsLoadingChannels(false)
    }
  }

  const toggleChannel = (channel: DiscordChannel) => {
    const currentChannels = form.getValues('channels')
    const existingIndex = currentChannels.findIndex(
      ch => ch.channelId === channel.id,
    )

    if (existingIndex >= 0) {
      // Remove channel
      const newChannels = currentChannels.filter(
        (_, idx) => idx !== existingIndex,
      )
      form.setValue('channels', newChannels)
    } else {
      // Add channel
      const newChannels = [
        ...currentChannels,
        {
          channelId: channel.id,
          channelName: channel.name,
          access: 'read_write' as const,
        },
      ]
      form.setValue('channels', newChannels)
    }
  }

  const updateChannelAccess = (
    channelId: string,
    access: 'read_write' | 'read_only',
  ) => {
    const currentChannels = form.getValues('channels')
    const newChannels = currentChannels.map(ch =>
      ch.channelId === channelId ? { ...ch, access } : ch,
    )
    form.setValue('channels', newChannels)
  }

  const selectedChannels = form.watch('channels')

  return (
    <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
      <DeploymentCollapsibleTrigger
        isOpen={isOpen}
        isDeployed={isDeployed ?? false}
        label="Discord V3 (Beta)"
        tooltip="Deploy your agent to Discord using webhooks"
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
        <div className="flex flex-col w-full space-y-4 p-4">
          {/* OAuth First - Show connect button if haven't completed OAuth */}
          {!hasCompletedOAuth && !isDeployed ? (
            <>
              <Button
                onClick={handleConnectDiscord}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Discord'
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Connected Status */}
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <span className="text-sm text-green-800 dark:text-green-200">
                  Discord connected - {availableServers.length} server
                  {availableServers.length !== 1 ? 's' : ''}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleConnectDiscord}
                  disabled={isConnecting}
                  className="h-7 text-xs"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    'Reconnect'
                  )}
                </Button>
              </div>

              {/* No servers found - Show bot invite */}
              {availableServers.length === 0 ? (
                <div className="space-y-3">
                  <div className="p-4 text-center border border-dashed rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">
                      No servers found where you're an admin and the Eden bot is
                      added.
                    </p>
                    <Button variant="default" className="w-full" asChild>
                      <a
                        href={BOT_INVITE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Add Eden Bot to Server
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Deployment Form */}
                  <Form {...form}>
                    <div className="space-y-4">
                      {/* Server Selector */}
                      <FormField
                        control={form.control}
                        name="guildId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Server</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a server" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableServers.map(server => (
                                  <SelectItem key={server.id} value={server.id}>
                                    {server.name}
                                    {server.owner && (
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        (Owner)
                                      </span>
                                    )}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select the Discord server where you want to deploy
                              this agent
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Channel Selector */}
                      {selectedGuildId && (
                        <div className="space-y-3">
                          <div>
                            <FormLabel>Channels</FormLabel>
                            <FormDescription className="mt-1">
                              Select channels and set read/write access for each
                            </FormDescription>
                          </div>

                          {isLoadingChannels ? (
                            <div className="flex items-center justify-center p-8">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          ) : availableChannels.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground text-center border border-dashed rounded-lg">
                              No text channels found in this server
                            </div>
                          ) : (
                            <div className="space-y-2 border rounded-lg p-3">
                              {availableChannels.map(channel => {
                                const isSelected = selectedChannels.some(
                                  ch => ch.channelId === channel.id,
                                )
                                const channelData = selectedChannels.find(
                                  ch => ch.channelId === channel.id,
                                )

                                return (
                                  <div
                                    key={channel.id}
                                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded"
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() =>
                                          toggleChannel(channel)
                                        }
                                      />
                                      <span className="text-sm">
                                        #{channel.name}
                                      </span>
                                    </div>

                                    {isSelected && (
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={
                                            channelData?.access === 'read_write'
                                          }
                                          onCheckedChange={checked =>
                                            updateChannelAccess(
                                              channel.id,
                                              checked
                                                ? 'read_write'
                                                : 'read_only',
                                            )
                                          }
                                        />
                                        <span className="text-xs text-muted-foreground w-20">
                                          {channelData?.access === 'read_write'
                                            ? 'Read/Write'
                                            : 'Read-only'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {selectedChannels.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Selected {selectedChannels.length} channel
                              {selectedChannels.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bot Invite Link */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          Don't see your server?
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          asChild
                          type="button"
                        >
                          <a
                            href={BOT_INVITE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Add Eden Bot to Another Server
                          </a>
                        </Button>
                      </div>

                      <DeploymentFormFooter
                        agentId={agentId}
                        platform="discord_v3"
                        form={form}
                        isDeployed={isDeployed ?? false}
                        guideUrl="https://docs.eden.art/integrations/discord"
                        valid={deployment?.valid}
                      />
                    </div>
                  </Form>
                </>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
