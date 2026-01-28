'use client'

import { Badge } from '@/components/ui/badge'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { useMe } from '@/hooks/use-me'
import { openOAuthPopup } from '@/lib/oauth-popup'
import { cn } from '@/lib/utils'
import { useAuth } from '@clerk/nextjs'
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
        guildId: z.string().optional(),
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
  access?: 'admin' | 'role'
}

interface DiscordChannel {
  id: string
  name: string
  type: number
  permissions?: {
    can_view?: boolean
    can_read_history?: boolean
    can_send?: boolean
    can_manage_webhooks?: boolean
  }
  validation?: {
    errors?: string[]
    warnings?: string[]
    has_webhook?: boolean | null
  }
}

interface DiscordRole {
  id: string
  name: string
  color?: number
  managed?: boolean
}

const CHANNEL_VALIDATION_LABELS: Record<string, string> = {
  missing_view_channel: 'No View Channel',
  missing_read_message_history: 'No Read History',
  missing_manage_webhooks: 'No Manage Webhooks',
  missing_send_messages: 'No Send Messages',
  missing_webhook: 'No webhook',
}

type DiscordV3ChannelConfig = {
  guild_id?: string
  channel_id: string
  channel_name?: string
  access?: 'read_only' | 'read_write'
}

type DiscordV3DeploymentConfig = {
  discord?: {
    guild_id?: string
    guilds?: Array<{
      guild_id: string
      guild_name?: string
      role_id?: string
      role_name?: string
    }>
    channel_configs?: DiscordV3ChannelConfig[]
  }
}

interface DiscordV3DeploymentFormProps {
  agentId: Agent['_id']
  deployment?: Deployment
  variant?: 'collapsible' | 'inline'
}

const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
const BOT_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=123211940928&integration_type=0&scope=bot`

export const DiscordV3DeploymentForm = ({
  agentId,
  deployment,
  variant = 'collapsible',
}: DiscordV3DeploymentFormProps) => {
  const isInline = variant === 'inline'
  const [isOpen, setIsOpen] = useState(isInline ? true : false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isRefreshingServers, setIsRefreshingServers] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [hasCompletedOAuth, setHasCompletedOAuth] = useState(false)
  const [hasLoadedServers, setHasLoadedServers] = useState(false)
  const [loadedChannelsForGuild, setLoadedChannelsForGuild] = useState<
    string | null
  >(null)
  const popupRef = useRef<Window | null>(null)
  const { userId, isSignedIn } = useAuth()
  const {
    user,
    invalidate: invalidateMe,
    isLoading: isAccountLoading,
  } = useMe({ isAuthenticated: Boolean(isSignedIn) })
  const isDiscordLinked = Boolean(user?.discordId)

  const [availableServers, setAvailableServers] = useState<DiscordGuild[]>([])
  const [availableChannels, setAvailableChannels] = useState<DiscordChannel[]>(
    [],
  )
  const [isLoadingChannels, setIsLoadingChannels] = useState(false)
  const [activeTab, setActiveTab] = useState<'deploy' | 'account'>('deploy')
  const [accessGuildId, setAccessGuildId] = useState('')
  const [channelSearch, setChannelSearch] = useState('')
  const [guildRoles, setGuildRoles] = useState<DiscordRole[]>([])
  const [allowedRoleIds, setAllowedRoleIds] = useState<string[]>([])
  const [initialAllowedRoleIds, setInitialAllowedRoleIds] = useState<string[]>(
    [],
  )
  const [isLoadingAccessRoles, setIsLoadingAccessRoles] = useState(false)
  const [isSavingAccessRoles, setIsSavingAccessRoles] = useState(false)

  const deploymentConfig = useMemo(
    () =>
      (deployment?.config as DiscordV3DeploymentConfig | undefined) ??
      undefined,
    [deployment?.config],
  )
  const initialGuildId = useMemo(
    () => deploymentConfig?.discord?.guild_id ?? '',
    [deploymentConfig?.discord?.guild_id],
  )
  const initialChannels: DiscordV3FormDto['channels'] = useMemo(
    () =>
      deploymentConfig?.discord?.channel_configs?.map(channel => ({
        channelId: channel.channel_id,
        channelName: channel.channel_name || channel.channel_id,
        access: channel.access === 'read_only' ? 'read_only' : 'read_write',
        guildId:
          channel.guild_id ?? deploymentConfig?.discord?.guild_id ?? undefined,
      })) ?? [],
    [
      deploymentConfig?.discord?.channel_configs,
      deploymentConfig?.discord?.guild_id,
    ],
  )

  const form = useForm<DiscordV3FormDto, undefined, DiscordV3FormDto>({
    resolver: zodResolver(schema),
    defaultValues: {
      guildId: '',
      channels: initialChannels,
    },
  })

  const selectedGuildId = form.watch('guildId')

  const isDeployed = useMemo(() => {
    return deployment !== undefined
  }, [deployment])

  const adminServers = useMemo(() => {
    return availableServers.filter(
      server => server.access === 'admin' || !server.access,
    )
  }, [availableServers])

  const isAccessDirty = useMemo(() => {
    if (allowedRoleIds.length !== initialAllowedRoleIds.length) return true
    const allowedSet = new Set(allowedRoleIds)
    return initialAllowedRoleIds.some(roleId => !allowedSet.has(roleId))
  }, [allowedRoleIds, initialAllowedRoleIds])

  const wasDeployed = useRef(isDeployed)
  const hasInitializedDeployment = useRef(false)
  useEffect(() => {
    if (isInline) return
    if (wasDeployed.current && !isDeployed) {
      setIsOpen(false)
    }
    wasDeployed.current = isDeployed
  }, [isDeployed, isInline])

  useEffect(() => {
    if (!deployment || hasInitializedDeployment.current) {
      return
    }
    form.reset({
      guildId: '',
      channels: initialChannels,
    })
    hasInitializedDeployment.current = true
  }, [deployment, form, initialChannels, initialGuildId])

  const cleanupPopup = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
    }
    popupRef.current = null
    setIsConnecting(false)
  }, [])

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
        setHasLoadedServers(true)

        await invalidateMe()

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
  }, [cleanupPopup, invalidateMe])

  const handleConnectDiscord = async () => {
    setIsConnecting(true)

    const clientId = DISCORD_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_EDEN_API_URL}/v2/deployments/discord/oauth/callback`
    const scope = 'guilds identify'

    // Use same encoding as discord-auth-button
    const statePayload = JSON.stringify({
      agent_id: agentId,
      user_id: userId,
      mode: 'popup',
    })

    const oauthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&response_type=code&scope=${scope}&state=${encodeURIComponent(
      statePayload,
    )}`

    const popup = openOAuthPopup({
      name: 'discord-v3-oauth',
      features: 'width=500,height=700',
      title: 'Connecting to Discord',
      message: 'Connecting to Discord...',
    })

    if (!popup) {
      window.location.href = oauthUrl
      return
    }

    popup.location.href = oauthUrl
    popupRef.current = popup
  }

  const loadChannels = useCallback(async (guildId: string) => {
    try {
      setIsLoadingChannels(true)
      setLoadedChannelsForGuild(null)
      setAvailableChannels([])
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
      setLoadedChannelsForGuild(guildId)
    }
  }, [])

  const refreshAvailableServers = useCallback(
    async (options?: { showToast?: boolean }) => {
      const showToast = options?.showToast ?? true
      try {
        setIsRefreshingServers(true)
        const response = await fetch('/api/integrations/discord/guilds')

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null)
          throw new Error(
            errorPayload?.message || 'Failed to refresh Discord servers',
          )
        }

        const data = await response.json()
        const guilds = data?.guilds ?? []
        setAvailableServers(guilds)
        setHasCompletedOAuth(true)

        if (showToast) {
          toast.success('Discord refreshed', {
            description: `Found ${guilds.length} server${
              guilds.length !== 1 ? 's' : ''
            }`,
          })
        }
      } catch (error) {
        if (showToast) {
          const message = error instanceof Error ? error.message : undefined
          toast.error(message || 'Failed to refresh Discord servers')
        }
      } finally {
        setIsRefreshingServers(false)
        setHasLoadedServers(true)
      }
    },
    [],
  )

  const loadAccessRoles = useCallback(async (guildId: string) => {
    try {
      setIsLoadingAccessRoles(true)
      const [rolesResponse, accessResponse] = await Promise.all([
        fetch(`/api/integrations/discord/guilds/${guildId}/roles`),
        fetch(`/api/integrations/discord/guilds/${guildId}/access`),
      ])

      if (!rolesResponse.ok) {
        const errorPayload = await rolesResponse.json().catch(() => null)
        throw new Error(errorPayload?.message || 'Failed to load server roles')
      }
      if (!accessResponse.ok) {
        const errorPayload = await accessResponse.json().catch(() => null)
        throw new Error(errorPayload?.message || 'Failed to load access roles')
      }

      const rolesData = await rolesResponse.json()
      const accessData = await accessResponse.json()

      setGuildRoles(rolesData.roles || [])
      const nextAllowedRoleIds = accessData.allowedRoleIds || []
      setAllowedRoleIds(nextAllowedRoleIds)
      setInitialAllowedRoleIds(nextAllowedRoleIds)
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined
      toast.error(message || 'Failed to load server roles')
      setGuildRoles([])
      setAllowedRoleIds([])
      setInitialAllowedRoleIds([])
    } finally {
      setIsLoadingAccessRoles(false)
    }
  }, [])

  const saveAccessRoles = async () => {
    if (!accessGuildId) return
    try {
      setIsSavingAccessRoles(true)
      const response = await fetch(
        `/api/integrations/discord/guilds/${accessGuildId}/access`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ allowedRoleIds }),
        },
      )

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        throw new Error(
          errorPayload?.message || 'Failed to update access roles',
        )
      }

      const data = await response.json()
      const nextAllowedRoleIds = data.allowedRoleIds || []
      setAllowedRoleIds(nextAllowedRoleIds)
      setInitialAllowedRoleIds(nextAllowedRoleIds)
      toast.success('Access roles updated')
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined
      toast.error(message || 'Failed to update access roles')
    } finally {
      setIsSavingAccessRoles(false)
    }
  }

  const toggleAllowedRole = (roleId: string) => {
    setAllowedRoleIds(current => {
      if (current.includes(roleId)) {
        return current.filter(id => id !== roleId)
      }
      return [...current, roleId]
    })
  }

  const toggleChannel = (channel: DiscordChannel) => {
    const hasErrors = (channel.validation?.errors || []).length > 0
    const currentChannels = form.getValues('channels')
    const existingIndex = currentChannels.findIndex(
      ch => ch.channelId === channel.id,
    )
    if (hasErrors && existingIndex === -1) {
      toast.error('Cannot select channel', {
        description:
          channel.validation?.errors
            ?.map(error => CHANNEL_VALIDATION_LABELS[error] || error)
            .join(', ') || 'Missing required permissions',
      })
      return
    }

    if (existingIndex >= 0) {
      // Remove channel
      const newChannels = currentChannels.filter(
        (_, idx) => idx !== existingIndex,
      )
      form.setValue('channels', newChannels, {
        shouldDirty: true,
        shouldValidate: true,
      })
    } else {
      // Add channel
      const newChannels = [
        ...currentChannels,
        {
          channelId: channel.id,
          channelName: channel.name,
          access: 'read_write' as const,
          guildId: selectedGuildId || undefined,
        },
      ]
      form.setValue('channels', newChannels, {
        shouldDirty: true,
        shouldValidate: true,
      })
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
    form.setValue('channels', newChannels, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  useEffect(() => {
    if (!user?.discordId) {
      return
    }
    if (isDeployed || !hasCompletedOAuth) {
      refreshAvailableServers({ showToast: false })
    }
  }, [hasCompletedOAuth, isDeployed, refreshAvailableServers, user?.discordId])

  useEffect(() => {
    setChannelSearch('')
  }, [selectedGuildId])

  useEffect(() => {
    if (!accessGuildId && adminServers.length > 0) {
      setAccessGuildId(adminServers[0].id)
    }
  }, [accessGuildId, adminServers])

  useEffect(() => {
    if (
      accessGuildId &&
      adminServers.length > 0 &&
      !adminServers.some(server => server.id === accessGuildId)
    ) {
      setAccessGuildId(adminServers[0].id)
    }
  }, [accessGuildId, adminServers])

  useEffect(() => {
    if (adminServers.length === 0) {
      setAccessGuildId('')
      setGuildRoles([])
      setAllowedRoleIds([])
      setInitialAllowedRoleIds([])
    }
  }, [adminServers])

  useEffect(() => {
    if (accessGuildId) {
      loadAccessRoles(accessGuildId)
    }
  }, [accessGuildId, loadAccessRoles])

  const handleDisconnectDiscord = async () => {
    try {
      setIsDisconnecting(true)
      const response = await fetch('/api/auth/discord', { method: 'DELETE' })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        throw new Error(
          errorPayload?.message || 'Failed to disconnect Discord account',
        )
      }

      await invalidateMe()
      setHasCompletedOAuth(false)
      setHasLoadedServers(false)
      setAvailableServers([])
      setAvailableChannels([])
      setLoadedChannelsForGuild(null)
      setAccessGuildId('')
      setGuildRoles([])
      setAllowedRoleIds([])
      setInitialAllowedRoleIds([])
      form.reset({ guildId: '', channels: [] })

      toast.success('Discord account disconnected')
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined
      toast.error(message || 'Failed to disconnect Discord account')
    } finally {
      setIsDisconnecting(false)
    }
  }

  const selectedChannels = form.watch('channels')
  const selectedChannelIds = useMemo(
    () => new Set(selectedChannels.map(channel => channel.channelId)),
    [selectedChannels],
  )
  const invalidSelectedChannels = useMemo(() => {
    const availableById = new Map(
      availableChannels.map(channel => [channel.id, channel]),
    )
    return selectedChannels.filter(channel => {
      const info = availableById.get(channel.channelId)
      return (info?.validation?.errors?.length ?? 0) > 0
    })
  }, [availableChannels, selectedChannels])
  const invalidSelectedChannelNames = useMemo(() => {
    if (invalidSelectedChannels.length === 0) return []
    const availableById = new Map(
      availableChannels.map(channel => [channel.id, channel]),
    )
    return invalidSelectedChannels.map(channel => {
      const info = availableById.get(channel.channelId)
      return info?.name ? `#${info.name}` : channel.channelId
    })
  }, [availableChannels, invalidSelectedChannels])
  const normalizedSearch = channelSearch.trim().toLowerCase()
  const matchSearch = useCallback(
    (channel: DiscordChannel) => {
      if (!normalizedSearch) return true
      return (
        channel.name.toLowerCase().includes(normalizedSearch) ||
        channel.id.includes(normalizedSearch)
      )
    },
    [normalizedSearch],
  )
  const selectedChannelsForGuild = useMemo(
    () =>
      availableChannels.filter(channel => selectedChannelIds.has(channel.id)),
    [availableChannels, selectedChannelIds],
  )
  const unselectedChannelsForGuild = useMemo(
    () =>
      availableChannels.filter(channel => !selectedChannelIds.has(channel.id)),
    [availableChannels, selectedChannelIds],
  )
  const filteredSelectedChannels = useMemo(
    () => selectedChannelsForGuild.filter(matchSearch),
    [matchSearch, selectedChannelsForGuild],
  )
  const filteredUnselectedChannels = useMemo(
    () => unselectedChannelsForGuild.filter(matchSearch),
    [matchSearch, unselectedChannelsForGuild],
  )
  const selectedServerName = useMemo(() => {
    if (!selectedGuildId) return null
    return (
      availableServers.find(server => server.id === selectedGuildId)?.name ||
      null
    )
  }, [availableServers, selectedGuildId])
  const selectedCountByGuild = useMemo(() => {
    const counts = new Map<string, number>()
    selectedChannels.forEach(channel => {
      const guildId = channel.guildId || initialGuildId
      if (!guildId) return
      counts.set(guildId, (counts.get(guildId) ?? 0) + 1)
    })
    return counts
  }, [initialGuildId, selectedChannels])
  const getSelectedCountForServer = useCallback(
    (serverId: string) => selectedCountByGuild.get(serverId) ?? 0,
    [selectedCountByGuild],
  )
  const shouldBlockForOAuth =
    isAccountLoading || (isDiscordLinked && !hasLoadedServers)
  const open = isInline ? true : isOpen

  const renderChannelRow = (channel: DiscordChannel) => {
    const isSelected = selectedChannelIds.has(channel.id)
    const channelData = selectedChannels.find(ch => ch.channelId === channel.id)
    const errors = channel.validation?.errors ?? []
    const warnings = channel.validation?.warnings ?? []
    const hasErrors = errors.length > 0
    const hasWarnings = warnings.length > 0
    const isDisabled = hasErrors && !isSelected

    return (
      <div
        key={channel.id}
        className={cn(
          'flex items-center justify-between p-2 rounded',
          isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
          !isDisabled && 'hover:bg-muted/50',
        )}
        onClick={() => {
          if (!isDisabled) toggleChannel(channel)
        }}
        role="button"
        tabIndex={0}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            if (!isDisabled) toggleChannel(channel)
          }
        }}
      >
        <div className="flex items-center gap-3 flex-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleChannel(channel)}
            onClick={event => event.stopPropagation()}
            disabled={isDisabled}
          />
          <div className="flex flex-col">
            <span className="text-sm">#{channel.name}</span>
            {(hasErrors || hasWarnings) && (
              <div className="flex flex-wrap gap-1 mt-1">
                {errors.map(error => (
                  <Badge
                    key={error}
                    variant="destructive"
                    className="text-[10px]"
                  >
                    {CHANNEL_VALIDATION_LABELS[error] || error}
                  </Badge>
                ))}
                {warnings.map(warning => (
                  <Badge
                    key={warning}
                    variant="secondary"
                    className="text-[10px]"
                  >
                    {CHANNEL_VALIDATION_LABELS[warning] || warning}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {isSelected && (
          <div className="flex items-center gap-2">
            <Switch
              checked={channelData?.access === 'read_write'}
              onCheckedChange={checked =>
                updateChannelAccess(
                  channel.id,
                  checked ? 'read_write' : 'read_only',
                )
              }
              onClick={event => event.stopPropagation()}
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
  }

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
        tooltip="Deploy your agent to Discord with OAuth"
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
        <div className="flex flex-col w-full space-y-4 p-4">
          {shouldBlockForOAuth ? (
            <div className="flex min-h-[200px] items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading Discord connection...
            </div>
          ) : !isDiscordLinked ? (
            /* OAuth First - Show connect button if haven't completed OAuth */
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
                  Discord connected
                  {user?.discordUsername || user?.discordId
                    ? ` as ${user?.discordUsername ?? user?.discordId}`
                    : ''}{' '}
                  - {availableServers.length} server
                  {availableServers.length !== 1 ? 's' : ''}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refreshAvailableServers()}
                  disabled={isRefreshingServers}
                  className="h-7 text-xs"
                >
                  {isRefreshingServers ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={value =>
                  setActiveTab(value as 'deploy' | 'account')
                }
                className="space-y-4"
              >
                <TabsList className="grid w-full grid-cols-2 gap-1 rounded-lg bg-muted/40 p-1">
                  <TabsTrigger value="deploy" className="text-sm">
                    Deploy
                  </TabsTrigger>
                  <TabsTrigger value="account" className="text-sm">
                    Account
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="deploy" className="space-y-4">
                  {/* No servers found - Show bot invite */}
                  {availableServers.length === 0 ? (
                    <div className="space-y-3">
                      <div className="p-4 text-center border border-dashed rounded-lg">
                        <p className="text-sm text-muted-foreground mb-3">
                          No servers found where you&apos;re an admin or have a
                          role that can deploy, and the Eden bot is added.
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          After adding the bot to a server, click Refresh to
                          reload this list.
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
                                  onValueChange={value => {
                                    form.setValue('guildId', value, {
                                      shouldDirty: false,
                                      shouldValidate: true,
                                    })
                                    loadChannels(value)
                                  }}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a server" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {availableServers.map(server => (
                                      <SelectItem
                                        key={server.id}
                                        value={server.id}
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <span>
                                            {server.name}
                                            {server.owner && (
                                              <span className="ml-2 text-xs text-muted-foreground">
                                                (Owner)
                                              </span>
                                            )}
                                            {server.access === 'role' && (
                                              <span className="ml-2 text-xs text-muted-foreground">
                                                (Role access)
                                              </span>
                                            )}
                                          </span>
                                          {getSelectedCountForServer(
                                            server.id,
                                          ) > 0 && (
                                            <Badge
                                              variant="secondary"
                                              className="text-[10px]"
                                            >
                                              {getSelectedCountForServer(
                                                server.id,
                                              )}{' '}
                                              channels selected
                                            </Badge>
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Select the Discord server where you want to
                                  deploy this agent
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
                                  Select channels and set read/write access for
                                  each
                                </FormDescription>
                              </div>

                              {isLoadingChannels ? (
                                <div className="flex items-center justify-center p-8">
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                              ) : loadedChannelsForGuild !== selectedGuildId ? (
                                <div className="flex items-center justify-center p-8">
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                              ) : availableChannels.length === 0 ? (
                                <div className="p-4 text-sm text-muted-foreground text-center border border-dashed rounded-lg">
                                  No text channels found in this server
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <Input
                                    value={channelSearch}
                                    onChange={event =>
                                      setChannelSearch(event.target.value)
                                    }
                                    placeholder="Search channels"
                                  />
                                  {invalidSelectedChannelNames.length > 0 && (
                                    <div className="text-xs text-destructive">
                                      Some selected channels are missing
                                      required permissions:{' '}
                                      {invalidSelectedChannelNames.join(', ')}
                                    </div>
                                  )}

                                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                                    {selectedChannelsForGuild.length > 0 && (
                                      <div className="space-y-2">
                                        <div className="text-[11px] font-semibold uppercase text-muted-foreground">
                                          Deployed channels
                                        </div>
                                        <div className="space-y-2 border rounded-lg p-3">
                                          {filteredSelectedChannels.length ===
                                          0 ? (
                                            <div className="text-xs text-muted-foreground">
                                              No deployed channels match this
                                              search.
                                            </div>
                                          ) : (
                                            filteredSelectedChannels.map(
                                              renderChannelRow,
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    <div className="space-y-2">
                                      <div className="text-[11px] font-semibold uppercase text-muted-foreground">
                                        All channels
                                      </div>
                                      <div className="space-y-2 border rounded-lg p-3">
                                        {filteredUnselectedChannels.length ===
                                        0 ? (
                                          <div className="text-xs text-muted-foreground">
                                            No channels match this search.
                                          </div>
                                        ) : (
                                          filteredUnselectedChannels.map(
                                            renderChannelRow,
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {selectedChannelsForGuild.length > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  Selected {selectedChannelsForGuild.length}{' '}
                                  channel
                                  {selectedChannelsForGuild.length !== 1
                                    ? 's'
                                    : ''}{' '}
                                  {selectedServerName
                                    ? `in ${selectedServerName}`
                                    : 'in this server'}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground border-t pt-2">
                            <span>Need to manage servers or roles?</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() => setActiveTab('account')}
                              className="h-7 text-xs"
                            >
                              Open account settings
                            </Button>
                          </div>

                          <DeploymentFormFooter
                            agentId={agentId}
                            platform="discord_v3"
                            form={form}
                            isDeployed={isDeployed ?? false}
                            guideUrl="https://docs.eden.art/integrations/discord"
                            valid={deployment?.valid}
                            canSubmit={invalidSelectedChannels.length === 0}
                          />
                        </div>
                      </Form>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="account" className="space-y-4">
                  <div className="rounded-lg border border-border/60 p-4 space-y-3 bg-muted/20">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">Discord account</div>
                      {isDiscordLinked && (
                        <Badge variant="outline" className="text-[10px]">
                          Connected
                        </Badge>
                      )}
                    </div>
                    {isDiscordLinked ? (
                      <p className="text-xs text-muted-foreground">
                        Connected as{' '}
                        <span className="text-foreground">
                          {user?.discordUsername ?? user?.discordId}
                        </span>
                        .
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Connect a Discord account to load your servers.
                      </p>
                    )}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button
                        variant="default"
                        onClick={handleConnectDiscord}
                        disabled={isConnecting || Boolean(isAccountLoading)}
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : isDiscordLinked ? (
                          'Connect different account'
                        ) : (
                          'Connect Discord account'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDisconnectDiscord}
                        disabled={
                          !isDiscordLinked ||
                          isDisconnecting ||
                          Boolean(isAccountLoading)
                        }
                      >
                        {isDisconnecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Disconnecting...
                          </>
                        ) : (
                          'Disconnect'
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/60 p-4 space-y-4 bg-muted/20">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">
                        Server access roles
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Admins only
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Admins can deploy by default. Assign roles to let
                      non-admins deploy agents to this server.
                    </p>

                    {adminServers.length === 0 ? (
                      <div className="text-xs text-muted-foreground">
                        You don&apos;t have any admin servers connected yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Server</Label>
                          <Select
                            value={accessGuildId}
                            onValueChange={setAccessGuildId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a server" />
                            </SelectTrigger>
                            <SelectContent>
                              {adminServers.map(server => (
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
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">
                            Roles allowed to deploy
                          </Label>
                          {isLoadingAccessRoles ? (
                            <div className="flex items-center justify-center p-6">
                              <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                          ) : guildRoles.length === 0 ? (
                            <div className="text-xs text-muted-foreground border border-dashed rounded-lg p-3 text-center">
                              No roles found for this server.
                            </div>
                          ) : (
                            <div className="space-y-2 border rounded-lg p-3 max-h-52 overflow-y-auto">
                              {guildRoles.map(role => (
                                <div
                                  key={role.id}
                                  className="flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    <Checkbox
                                      checked={allowedRoleIds.includes(role.id)}
                                      onCheckedChange={() =>
                                        toggleAllowedRole(role.id)
                                      }
                                    />
                                    <span className="text-sm">{role.name}</span>
                                  </div>
                                  {role.managed && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      Managed
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Tip: manage roles via Discord slash commands:
                            <span className="ml-1 text-foreground">
                              /eden access add-role
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="default"
                          onClick={saveAccessRoles}
                          disabled={
                            isSavingAccessRoles ||
                            isLoadingAccessRoles ||
                            !isAccessDirty ||
                            !accessGuildId
                          }
                          className="w-full"
                        >
                          {isSavingAccessRoles ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save roles'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-border/60 p-4 space-y-3">
                    <div className="text-sm font-medium">
                      Servers with Eden bot
                    </div>
                    {availableServers.length === 0 ? (
                      <div className="text-xs text-muted-foreground">
                        No servers found yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {availableServers.map(server => (
                          <div
                            key={server.id}
                            className="flex items-center justify-between rounded-md border border-border/50 bg-background/60 px-3 py-2 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span>{server.name}</span>
                              {server.owner && (
                                <span className="text-xs text-muted-foreground">
                                  (Owner)
                                </span>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-[10px]">
                              {server.access === 'role'
                                ? 'Role access'
                                : 'Admin'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Add the Eden bot to another server
                    </div>
                    <Button variant="outline" className="w-full" asChild>
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
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
