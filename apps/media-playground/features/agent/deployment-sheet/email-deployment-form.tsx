'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { DeploymentCollapsibleTrigger } from '@/features/agent/deployment-sheet/deployment-collapsible-trigger'
import { DeploymentFormFooter } from '@/features/agent/deployment-sheet/deployment-form-footer'
import { cn } from '@/lib/utils'
import { Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const domainRecordSchema = z.object({
  record_type: z.string(),
  name: z.string(),
  value: z.string(),
  priority: z.number().optional(),
})

const emailDomainSchema = z
  .object({
    id: z.string().optional(),
    _id: z.string().optional(),
    domain: z.string(),
    status: z.enum(['pending', 'verified', 'failed']),
    dnsRecords: z.array(domainRecordSchema).optional(),
    provider_domain_id: z.string().optional(),
    inbound_route_id: z.string().optional(),
    inbound_route_expression: z.string().optional(),
    forwarding_address: z.string().optional(),
    webhook_signing_key: z.string().optional(),
    verificationErrors: z.array(z.string()).optional(),
    lastSyncedAt: z.string().optional(),
  })
  .optional()

const schema = z.object({
  senderEmail: z
    .string()
    .email('Enter a valid email address')
    .or(z.literal('')),
  autoreply: z.boolean().default(false),
  replyDelayAverage: z.coerce.number().min(0, 'Must be a positive number'),
  replyDelayVariance: z.coerce.number().min(0, 'Must be a positive number'),
  domain: emailDomainSchema,
})

type EmailDomainData = z.infer<typeof emailDomainSchema>
type EmailDeploymentFormSchema = z.infer<typeof schema>

interface EmailDeploymentFormProps {
  agentId: string
  deployment?: Deployment
}

export const EmailDeploymentForm = ({
  agentId,
  deployment,
}: EmailDeploymentFormProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [domainData, setDomainData] = useState<EmailDomainData>(undefined)
  const [isDomainLoading, setIsDomainLoading] = useState(false)
  const [isCreatingDomain, setIsCreatingDomain] = useState(false)
  const [domainInput, setDomainInput] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDeletingDomain, setIsDeletingDomain] = useState(false)

  const form = useForm<EmailDeploymentFormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      senderEmail: deployment?.config?.email?.sender_email ?? '',
      autoreply: deployment?.config?.email?.autoreply_enabled ?? false,
      replyDelayAverage:
        deployment?.config?.email?.reply_delay_average_minutes ?? 60,
      replyDelayVariance:
        deployment?.config?.email?.reply_delay_variance_minutes ?? 0,
      domain: undefined,
    },
  })

  const isDeployed = useMemo(() => deployment !== undefined, [deployment])

  const setDomainOnForm = useCallback(
    (domain: EmailDomainData) => {
      form.setValue('domain', domain, { shouldDirty: false })
    },
    [form],
  )

  const fetchDomain = useCallback(
    async (refresh = false) => {
      setIsDomainLoading(true)
      try {
        const response = await axios.get('/api/email/domain', {
          params: {
            agentId,
            refresh,
          },
        })

        const domain = response.data?.domain as EmailDomainData | undefined
        setDomainData(domain)
        setDomainOnForm(domain)
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setDomainData(undefined)
          setDomainOnForm(undefined)
        } else {
          const fallbackMessage = axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : error instanceof Error
            ? error.message
            : 'Failed to fetch email domain'
          const message =
            fallbackMessage && fallbackMessage.length > 0
              ? fallbackMessage
              : 'Failed to fetch email domain'
          toast.error(message, {
            richColors: true,
            dismissible: true,
          })
        }
      } finally {
        setIsDomainLoading(false)
      }
    },
    [agentId, setDomainOnForm],
  )

  useEffect(() => {
    fetchDomain(false)
  }, [fetchDomain])

  const handleCreateDomain = async () => {
    const trimmedDomain = domainInput.trim().toLowerCase()
    if (!trimmedDomain) {
      toast.error('Please enter a domain before continuing', {
        richColors: true,
        dismissible: true,
      })
      return
    }

    if (domainData) {
      toast.error(
        'A domain is already configured. Delete it before creating a new one.',
        {
          richColors: true,
          dismissible: true,
        },
      )
      return
    }

    setIsCreatingDomain(true)
    try {
      await axios.post('/api/email/domain', {
        agentId,
        domain: trimmedDomain,
      })

      toast.success('Domain created. Please add the DNS records below.', {
        richColors: true,
        dismissible: true,
      })
      setDomainInput('')
      await fetchDomain(false)
    } catch (error: unknown) {
      const fallbackMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
        ? error.message
        : 'Failed to create domain'
      const message =
        fallbackMessage && fallbackMessage.length > 0
          ? fallbackMessage
          : 'Failed to create domain'
      toast.error(message, {
        richColors: true,
        dismissible: true,
      })
    } finally {
      setIsCreatingDomain(false)
    }
  }

  const handleRefreshDomain = async () => {
    setIsRefreshing(true)
    await fetchDomain(true)
    setIsRefreshing(false)
  }

  const handleDeleteDomain = async () => {
    if (isDeployed) {
      toast.error('Remove the email deployment before deleting the domain.', {
        richColors: true,
        dismissible: true,
      })
      return
    }

    setIsDeletingDomain(true)
    try {
      await axios.delete('/api/email/domain', {
        params: {
          agentId,
        },
      })
      setDomainData(undefined)
      setDomainOnForm(undefined)
      setDomainInput('')
      form.reset({
        senderEmail: '',
        autoreply: false,
        replyDelayAverage: 60,
        replyDelayVariance: 0,
        domain: undefined,
      })
      toast.success('Domain deleted successfully', {
        richColors: true,
        dismissible: true,
      })
    } catch (error: unknown) {
      const fallbackMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
        ? error.message
        : 'Failed to delete domain'
      const message =
        fallbackMessage && fallbackMessage.length > 0
          ? fallbackMessage
          : 'Failed to delete domain'
      toast.error(message, {
        richColors: true,
        dismissible: true,
      })
    } finally {
      setIsDeletingDomain(false)
    }
  }

  useEffect(() => {
    if (!isDeployed) {
      form.reset(
        {
          senderEmail: '',
          autoreply: false,
          replyDelayAverage: 60,
          replyDelayVariance: 0,
          domain: domainData,
        },
        {
          keepDirty: false,
        },
      )
    }
  }, [isDeployed, domainData, form])

  useEffect(() => {
    if (isDeployed && deployment) {
      form.reset(
        {
          senderEmail: deployment.config?.email?.sender_email ?? '',
          autoreply: deployment.config?.email?.autoreply_enabled ?? false,
          replyDelayAverage:
            deployment.config?.email?.reply_delay_average_minutes ?? 60,
          replyDelayVariance:
            deployment.config?.email?.reply_delay_variance_minutes ?? 0,
          domain: domainData,
        },
        {
          keepDirty: false,
        },
      )
    }
  }, [isDeployed, deployment, domainData, form])

  const isDomainVerified = domainData?.status === 'verified'
  const domainStatusLabel = domainData?.status
    ? domainData.status.charAt(0).toUpperCase() + domainData.status.slice(1)
    : 'Not configured'

  const dnsRecords = domainData?.dnsRecords ?? []
  const verificationErrors = domainData?.verificationErrors ?? []
  const lastSyncedAt = domainData?.lastSyncedAt
    ? new Date(domainData.lastSyncedAt)
    : undefined

  const disableSettings = !isDomainVerified || isDomainLoading
  const senderEmailValue = form.watch('senderEmail')
  const canSubmit =
    isDomainVerified && Boolean(senderEmailValue && senderEmailValue.trim())

  return (
    <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
      <DeploymentCollapsibleTrigger
        isOpen={isOpen}
        isDeployed={isDeployed}
        label="Email"
        tooltip="Configure transactional email deployment"
        valid={deployment?.valid}
      />
      <CollapsibleContent
        className={cn(
          isOpen
            ? 'border border-gray-400/20 border-t-0 rounded-b-lg flex flex-col gap-4 p-4'
            : '',
          isDeployed ? 'border-success' : '',
          deployment?.valid === false ? 'border-destructive' : '',
        )}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Domain Verification</h3>
              <p className="text-xs text-muted-foreground">
                Connect a domain and add the DNS records provided below to
                verify ownership.
              </p>
            </div>
            <Badge
              variant={isDomainVerified ? 'default' : 'secondary'}
              className={cn(
                'uppercase tracking-wide',
                domainData?.status === 'failed' && 'bg-destructive text-white',
              )}
            >
              {domainStatusLabel}
            </Badge>
          </div>

          {isDomainLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Checking domain status...
            </div>
          ) : domainData ? (
            <div className="space-y-3 rounded-md border border-border/50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="font-medium">Domain:</span>{' '}
                  <span className="text-muted-foreground">
                    {domainData.domain}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshDomain}
                    disabled={isRefreshing || isDomainLoading}
                  >
                    {isRefreshing ? (
                      <Loader2 className="size-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteDomain}
                    disabled={isDeletingDomain || isDeployed}
                  >
                    {isDeletingDomain ? (
                      <Loader2 className="size-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="size-4 mr-2" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
              {lastSyncedAt && (
                <p className="text-xs text-muted-foreground">
                  Last checked: {lastSyncedAt.toLocaleString()}
                </p>
              )}

              {verificationErrors.length > 0 && (
                <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                  <p className="font-medium mb-1">Verification errors:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {verificationErrors.map((err, idx) => (
                      <li key={`${err}-${idx}`}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-md border border-dashed border-border/50 p-3">
              <div>
                <p className="text-sm font-medium">Connect your domain</p>
                <p className="text-xs text-muted-foreground">
                  Enter the domain you would like to send transactional emails
                  from (for example, <code>example.com</code>).
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={domainInput}
                  onChange={event => setDomainInput(event.target.value)}
                  placeholder="yourdomain.com"
                  className="sm:max-w-xs"
                  disabled={isCreatingDomain || !!domainData}
                />
                <Button
                  type="button"
                  onClick={handleCreateDomain}
                  disabled={
                    isCreatingDomain || !!domainData || !domainInput.trim()
                  }
                >
                  {isCreatingDomain ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create domain'
                  )}
                </Button>
              </div>
            </div>
          )}

          {dnsRecords.length > 0 && (
            <div className="space-y-2 rounded-md border border-border/50 p-3">
              <p className="text-sm font-medium">DNS Records</p>
              <p className="text-xs text-muted-foreground">
                Add the following records to your DNS provider. Verification can
                take a few minutes after the records propagate.
              </p>
              <div className="space-y-2">
                {dnsRecords.map(record => (
                  <div
                    key={`${record.record_type}-${record.name}-${record.value}`}
                    className="grid gap-1 rounded border border-border/60 p-3 text-xs md:grid-cols-2 lg:grid-cols-4"
                  >
                    <div>
                      <span className="font-medium">Type:</span>{' '}
                      <span className="text-muted-foreground">
                        {record.record_type}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Name:</span>{' '}
                      <span className="text-muted-foreground">
                        {record.name}
                      </span>
                    </div>
                    <div className="lg:col-span-2 break-words">
                      <span className="font-medium">Value:</span>{' '}
                      <span className="text-muted-foreground">
                        {record.value}
                      </span>
                    </div>
                    {typeof record.priority === 'number' && (
                      <div>
                        <span className="font-medium">Priority:</span>{' '}
                        <span className="text-muted-foreground">
                          {record.priority}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <Form {...form}>
          <form className="flex flex-col gap-4">
            {!isDomainVerified && (
              <p className="text-xs text-muted-foreground">
                Verify your domain to configure email settings and deploy your
                agent.
              </p>
            )}
            <fieldset
              className={cn('space-y-4', disableSettings && 'opacity-60')}
              disabled={disableSettings}
            >
              <FormField
                control={form.control}
                name="senderEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sender email address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="notifications@yourdomain.com"
                        {...field}
                        disabled={disableSettings}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoreply"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border border-border/40 p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Automatic replies</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Enable the agent to automatically reply to incoming
                        emails.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={disableSettings}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="replyDelayAverage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reply delay (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={5}
                          {...field}
                          disabled={disableSettings}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="replyDelayVariance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reply variance (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={5}
                          {...field}
                          disabled={disableSettings}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </fieldset>

            <DeploymentFormFooter
              form={form}
              agentId={agentId}
              platform="email"
              isDeployed={isDeployed}
              valid={deployment?.valid}
              canSubmit={canSubmit}
              guideUrl="https://docs.eden.art/integrations/email"
            />
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  )
}
