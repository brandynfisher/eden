'use client'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Form } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
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
import {
  Agent,
  Deployment,
  DeploymentSecretsGoogleCalendar,
  GoogleCalendarInfo,
} from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { AlertCircle, Calendar, CheckCircle, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const schema = z.object({
  calendarId: z.string().min(1, 'Please select a calendar'),
  calendarName: z.string().optional(),
  allowWrite: z.boolean().default(false),
  allowDelete: z.boolean().default(false),
  timeZone: z.string().optional(),
  // Credentials from OAuth (stored as hidden fields)
  credentials: z
    .object({
      access_token: z.string(),
      refresh_token: z.string(),
      token_uri: z.string(),
      client_id: z.string(),
      client_secret: z.string(),
      scopes: z.array(z.string()),
      expires_at: z.string().optional(),
      google_user_id: z.string().optional(),
      google_email: z.string().optional(), // May be unavailable if user info fetch fails
    })
    .optional(),
})

type DeploymentFormDto = z.infer<typeof schema>

interface GoogleCalendarOAuthResult {
  google_email: string
  credentials: DeploymentSecretsGoogleCalendar
  calendars: GoogleCalendarInfo[]
  agent_id: string
  user_id: string
}

interface GoogleCalendarDeploymentFormProps {
  agentId: Agent['_id']
  deployment?: Deployment
}

export const GoogleCalendarDeploymentForm = ({
  agentId,
  deployment,
}: GoogleCalendarDeploymentFormProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [oauthResult, setOauthResult] =
    useState<GoogleCalendarOAuthResult | null>(null)
  const [calendars, setCalendars] = useState<GoogleCalendarInfo[]>([])
  const popupRef = useRef<Window | null>(null)
  const queryClient = useQueryClient()

  const form = useForm<DeploymentFormDto>({
    resolver: zodResolver(schema),
    defaultValues: {
      calendarId: deployment?.config?.google_calendar?.calendar_id ?? '',
      calendarName: deployment?.config?.google_calendar?.calendar_name ?? '',
      allowWrite: deployment?.config?.google_calendar?.allow_write ?? false,
      allowDelete: deployment?.config?.google_calendar?.allow_delete ?? false,
      timeZone: deployment?.config?.google_calendar?.time_zone ?? '',
      credentials: undefined,
    },
  })

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

  // Check if Google Calendar is connected by looking at deployment secrets
  const isConnected = deployment?.secrets?.google_calendar?.access_token
    ? true
    : false
  const connectedEmail = deployment?.secrets?.google_calendar?.google_email
  const calendarName = deployment?.config?.google_calendar?.calendar_name

  // Cleanup popup on unmount
  const cleanupPopup = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
    }
    popupRef.current = null
    setIsConnecting(false)
  }, [])

  // Listen for OAuth callback message from popup
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Check message type
      if (
        !event.data ||
        typeof event.data !== 'object' ||
        event.data.type !== 'google-calendar-link'
      ) {
        return
      }

      cleanupPopup()

      if (event.data.success && event.data.result) {
        const result = event.data.result as GoogleCalendarOAuthResult
        setOauthResult(result)
        setCalendars(result.calendars || [])

        // Store credentials in form for submission
        if (result.credentials) {
          form.setValue('credentials', {
            access_token: result.credentials.access_token,
            refresh_token: result.credentials.refresh_token,
            token_uri: result.credentials.token_uri,
            client_id: result.credentials.client_id,
            client_secret: result.credentials.client_secret,
            scopes: result.credentials.scopes,
            expires_at:
              typeof result.credentials.expires_at === 'string'
                ? result.credentials.expires_at
                : result.credentials.expires_at?.toISOString(),
            google_user_id: result.credentials.google_user_id,
            google_email: result.credentials.google_email,
          })
        }

        // Auto-select primary calendar
        const primaryCalendar = result.calendars?.find(c => c.primary)
        if (primaryCalendar) {
          form.setValue('calendarId', primaryCalendar.id, { shouldDirty: true })
          form.setValue('calendarName', primaryCalendar.name)
          form.setValue('timeZone', primaryCalendar.timeZone || '')
        }

        toast.success('Google Calendar connected', {
          description: result.google_email
            ? `Connected as ${result.google_email}`
            : 'Ready to select a calendar',
        })
      } else {
        toast.error(event.data.message ?? 'Failed to connect Google Calendar')
      }
    }

    window.addEventListener('message', handleMessage)

    // Poll to check if popup was closed
    const interval = window.setInterval(() => {
      if (popupRef.current && popupRef.current.closed) {
        cleanupPopup()
      }
    }, 500)

    return () => {
      window.removeEventListener('message', handleMessage)
      window.clearInterval(interval)
    }
  }, [cleanupPopup, form])

  const handleConnect = async () => {
    setIsConnecting(true)

    try {
      // Get the OAuth authorization URL from backend
      const response = await axios.get(
        '/api/integrations/google-calendar/init',
        {
          params: {
            agent_id: agentId,
          },
        },
      )

      const { authorization_url } = response.data

      if (!authorization_url) {
        throw new Error('No authorization URL received')
      }

      // Open popup for OAuth
      const popup = window.open(
        authorization_url,
        'google-calendar-oauth',
        'width=600,height=700,scrollbars=yes',
      )

      if (!popup) {
        // Popup blocked - redirect instead
        window.location.href = authorization_url
        return
      }

      popupRef.current = popup
    } catch (error) {
      console.error('Failed to initiate Google Calendar OAuth:', error)
      toast.error('Failed to connect Google Calendar')
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await axios.delete(`/api/integrations/google-calendar?agentId=${agentId}`)
      toast.success('Google Calendar disconnected successfully')
      // Reset form and state
      setOauthResult(null)
      setCalendars([])
      form.reset()
      // Refresh deployments
      await queryClient.invalidateQueries({
        queryKey: ['agents', agentId, 'deployments'],
      })
    } catch (error) {
      toast.error('Failed to disconnect Google Calendar')
    }
  }

  const handleCalendarChange = (calendarId: string) => {
    form.setValue('calendarId', calendarId, { shouldDirty: true })
    const selectedCalendar = calendars.find(c => c.id === calendarId)
    if (selectedCalendar) {
      form.setValue('calendarName', selectedCalendar.name)
      form.setValue('timeZone', selectedCalendar.timeZone || '')
    }
  }

  // Watch for allowWrite changes to auto-disable allowDelete
  const allowWrite = form.watch('allowWrite')
  useEffect(() => {
    if (!allowWrite) {
      form.setValue('allowDelete', false)
    }
  }, [allowWrite, form])

  // Determine if we have credentials (either from OAuth or existing deployment)
  const hasCredentials = oauthResult?.credentials || isConnected
  const availableCalendars = calendars.length > 0 ? calendars : []
  const selectedCalendarId = form.watch('calendarId')
  const selectedCalendar = availableCalendars.find(
    c => c.id === selectedCalendarId,
  )

  return (
    <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
      <DeploymentCollapsibleTrigger
        isOpen={isOpen}
        isDeployed={isDeployed}
        label="Google Calendar"
        tooltip="Allow your agent to read and manage your Google Calendar events"
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
            <div className="space-y-4">
              {/* Connection Status */}
              {(isConnected || oauthResult) && (
                <div className="space-y-2">
                  <Label>Connection Status</Label>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {oauthResult?.google_email || connectedEmail ? (
                        <>
                          Connected as{' '}
                          <span className="font-medium">
                            {oauthResult?.google_email || connectedEmail}
                          </span>
                        </>
                      ) : (
                        'Connected to Google Calendar'
                      )}
                    </span>
                  </div>
                  {isDeployed && calendarName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Calendar: {calendarName}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Not Connected State */}
              {!hasCredentials ? (
                <>
                  <div className="text-sm text-muted-foreground">
                    Connect your Google Calendar to allow your agent to view and
                    manage your events. You can choose which calendar to use and
                    configure read/write permissions.
                  </div>
                  <Button
                    type="button"
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4 mr-2" />
                        Connect Google Calendar
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  {/* Calendar Selection (only show if we have fresh OAuth result with calendars) */}
                  {availableCalendars.length > 0 && (
                    <div className="space-y-2">
                      <Label>Select Calendar</Label>
                      <Select
                        value={selectedCalendarId}
                        onValueChange={handleCalendarChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a calendar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCalendars.map(calendar => (
                            <SelectItem key={calendar.id} value={calendar.id}>
                              <div className="flex items-center gap-2">
                                {calendar.backgroundColor && (
                                  <div
                                    className="h-3 w-3 rounded-full shrink-0"
                                    style={{
                                      backgroundColor: calendar.backgroundColor,
                                    }}
                                  />
                                )}
                                <span>{calendar.name}</span>
                                {calendar.primary && (
                                  <span className="text-xs text-muted-foreground">
                                    (Primary)
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedCalendar && (
                        <p className="text-xs text-muted-foreground">
                          Access: {selectedCalendar.accessRole} | Timezone:{' '}
                          {selectedCalendar.timeZone}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Permissions Section */}
                  <div className="space-y-4">
                    <Label>Agent Permissions</Label>

                    {/* Read Access - Always enabled */}
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">
                          Read Events
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Agent can view calendar events
                        </p>
                      </div>
                      <Switch checked disabled />
                    </div>

                    {/* Write Access */}
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">
                          Create & Edit Events
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Agent can create new events and modify existing ones
                        </p>
                      </div>
                      <Switch
                        checked={form.watch('allowWrite')}
                        onCheckedChange={checked => {
                          form.setValue('allowWrite', checked, {
                            shouldDirty: true,
                          })
                        }}
                      />
                    </div>

                    {/* Delete Access */}
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">
                          Delete Events
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Agent can delete calendar events
                        </p>
                      </div>
                      <Switch
                        checked={form.watch('allowDelete')}
                        onCheckedChange={checked => {
                          form.setValue('allowDelete', checked, {
                            shouldDirty: true,
                          })
                        }}
                        disabled={!allowWrite}
                      />
                    </div>
                  </div>

                  {/* Warning for write permissions */}
                  {allowWrite && (
                    <div className="flex items-start gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
                      <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-500">
                          Write access enabled
                        </p>
                        <p className="text-xs text-muted-foreground">
                          The agent will be able to create and modify events on
                          your calendar.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Disconnect button when connected but not deployed */}
                  {!isDeployed && (
                    <Button
                      type="button"
                      onClick={handleDisconnect}
                      variant="outline"
                      className="w-full"
                    >
                      Disconnect Google Calendar
                    </Button>
                  )}
                </>
              )}

              {/* Deploy/Update footer - only show when credentials exist */}
              {hasCredentials && (
                <DeploymentFormFooter
                  agentId={agentId}
                  platform="google_calendar"
                  form={form}
                  isDeployed={isDeployed}
                  valid={deployment?.valid}
                  canSubmit={!!selectedCalendarId || isDeployed}
                />
              )}
            </div>
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
