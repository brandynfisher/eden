'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
import { ChevronDown, Copy, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const domainRecordSchema = z.object({
  record_type: z.string(),
  name: z.string(),
  value: z.string(),
  priority: z.number().optional(),
  category: z.enum(['sending', 'receiving', 'tracking']).optional(),
  status: z.enum(['verified', 'unverified']).optional(),
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
  variant?: 'collapsible' | 'inline'
}

export const EmailDeploymentForm = ({
  agentId,
  deployment,
  variant = 'collapsible',
}: EmailDeploymentFormProps) => {
  const isInline = variant === 'inline'
  const [isOpen, setIsOpen] = useState(isInline ? true : false)
  const [domainData, setDomainData] = useState<EmailDomainData>(undefined)
  const [isDomainLoading, setIsDomainLoading] = useState(false)
  const [isCreatingDomain, setIsCreatingDomain] = useState(false)
  const [domainInput, setDomainInput] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDeletingDomain, setIsDeletingDomain] = useState(false)
  const [isDnsOpen, setIsDnsOpen] = useState(true)

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

  const wasDeployed = useRef(isDeployed)
  useEffect(() => {
    if (isInline) return
    if (wasDeployed.current && !isDeployed) {
      setIsOpen(false)
    }
    wasDeployed.current = isDeployed
  }, [isDeployed, isInline])

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

        if (response.data?.warning) {
          toast.warning(response.data.warning, {
            richColors: true,
            dismissible: true,
          })
        }
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
  const groupedRecords = useMemo(() => {
    return dnsRecords.reduce((acc, record) => {
      const key = record.category ?? 'other'
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(record)
      return acc
    }, {} as Record<string, typeof dnsRecords>)
  }, [dnsRecords])
  const verificationErrors = domainData?.verificationErrors ?? []
  const lastSyncedAt = domainData?.lastSyncedAt
    ? new Date(domainData.lastSyncedAt)
    : undefined

  useEffect(() => {
    if (domainData?.status && domainData.status !== 'verified') {
      setIsDnsOpen(true)
    }
  }, [domainData?.status])

  const handleCopy = useCallback((label: string, value?: string) => {
    if (!value) {
      toast.error('Nothing to copy', {
        richColors: true,
        dismissible: true,
      })
      return
    }

    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      toast.error('Clipboard access is not available in this browser', {
        richColors: true,
        dismissible: true,
      })
      return
    }

    navigator.clipboard
      .writeText(value)
      .then(() => {
        toast.success(`${label} copied to clipboard`, {
          richColors: true,
          dismissible: true,
          duration: 1500,
        })
      })
      .catch(() => {
        toast.error('Failed to copy to clipboard', {
          richColors: true,
          dismissible: true,
        })
      })
  }, [])

  const DnsField = ({
    label,
    value,
    onCopy,
    className,
  }: {
    label: string
    value?: string
    onCopy?: () => void
    className?: string
  }) => (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={onCopy}
          >
            <Copy className="h-3.5 w-3.5" />
            <span className="sr-only">Copy {label}</span>
          </Button>
        )}
      </div>
      <code className="block rounded border border-border/50 bg-muted/10 px-2 py-1 text-xs font-mono leading-relaxed text-foreground/90 break-all">
        {value ?? '—'}
      </code>
    </div>
  )

  const disableSettings = !isDomainVerified || isDomainLoading
  const senderEmailValue = form.watch('senderEmail')
  const canSubmit =
    isDomainVerified && Boolean(senderEmailValue && senderEmailValue.trim())

  const statusBadgeClass = isDomainVerified
    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
    : domainData?.status === 'failed'
    ? 'bg-destructive/15 text-destructive border border-destructive/30'
    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'

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
        isDeployed={isDeployed}
        label="Email"
        tooltip="Configure transactional email deployment"
        valid={deployment?.valid}
        isStatic={isInline}
      />
      <CollapsibleContent
        className={cn(
          open
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
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide',
                statusBadgeClass,
              )}
            >
              {domainStatusLabel}
            </span>
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
            <Collapsible
              open={isDnsOpen}
              onOpenChange={setIsDnsOpen}
              className="rounded-md border border-border/50"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-muted/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-border">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">DNS records</p>
                  <p className="text-xs text-muted-foreground">
                    Add these at your DNS provider. Verification may take a few
                    minutes after propagation.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'uppercase tracking-wide border',
                      statusBadgeClass,
                      isDomainVerified && 'bg-emerald-500/15 text-emerald-300',
                    )}
                  >
                    {domainStatusLabel}
                  </Badge>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform',
                      isDnsOpen ? 'rotate-180' : '',
                    )}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 border-t border-border/40 px-3 pb-3 pt-3">
                {(['sending', 'receiving', 'tracking'] as const)
                  .filter(section => (groupedRecords[section] ?? []).length)
                  .map(section => {
                    const sectionRecords = groupedRecords[section] ?? []
                    const sectionLabel =
                      section === 'sending'
                        ? 'Sending records'
                        : section === 'receiving'
                        ? 'Receiving records'
                        : 'Tracking records'

                    return (
                      <div key={section} className="space-y-3">
                        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                          <p className="font-semibold">{sectionLabel}</p>
                          <span className="text-[10px]">
                            {sectionRecords.length}{' '}
                            {sectionRecords.length === 1 ? 'record' : 'records'}
                          </span>
                        </div>
                        <div className="grid gap-3">
                          {sectionRecords.map(record => {
                            const statusLabel =
                              record.status === 'verified'
                                ? 'Verified'
                                : 'Unverified'
                            const statusClasses =
                              record.status === 'verified'
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'

                            return (
                              <div
                                key={`${section}-${record.record_type}-${record.name}-${record.value}`}
                                className="overflow-hidden rounded-lg border border-border/60 bg-background/60 shadow-sm backdrop-blur-sm"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 px-3 py-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center rounded-md bg-muted/40 px-2 py-0.5 font-mono text-[11px] uppercase text-foreground/80">
                                      {record.record_type}
                                    </span>
                                    {typeof record.priority === 'number' && (
                                      <span className="rounded-full bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                        Priority {record.priority}
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={cn(
                                      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide',
                                      statusClasses,
                                    )}
                                  >
                                    {statusLabel}
                                  </span>
                                </div>
                                <div className="grid gap-3 p-3 sm:grid-cols-2">
                                  <DnsField
                                    label="Name"
                                    value={record.name}
                                    onCopy={() =>
                                      handleCopy(
                                        `${record.record_type} name`,
                                        record.name,
                                      )
                                    }
                                  />
                                  <DnsField
                                    label="Value"
                                    value={record.value}
                                    onCopy={() =>
                                      handleCopy(
                                        `${record.record_type} value`,
                                        record.value,
                                      )
                                    }
                                    className="sm:col-span-2"
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <Separator className="my-4" />

        {isDomainVerified && (
          <Form {...form}>
            <form className="flex flex-col gap-4">
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
                        {domainData?.domain ? (
                          <div className="flex items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                            <input
                              type="text"
                              className={cn(
                                'flex-1 border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground',
                                disableSettings && 'opacity-60',
                              )}
                              placeholder="agent"
                              value={
                                field.value && field.value.includes('@')
                                  ? field.value.replace(
                                      new RegExp(`@${domainData.domain}$`),
                                      '',
                                    )
                                  : field.value ?? ''
                              }
                              onChange={event => {
                                const localPart = event.target.value
                                const suffix = `@${domainData.domain}`
                                field.onChange(
                                  localPart
                                    ? `${localPart.replace(/@.*/, '')}${suffix}`
                                    : '',
                                )
                              }}
                              disabled={disableSettings}
                            />
                            <div className="flex items-center border-l border-border bg-muted/40 px-3 text-sm font-medium text-muted-foreground">
                              @{domainData.domain}
                            </div>
                          </div>
                        ) : (
                          <Input
                            placeholder="notifications@yourdomain.com"
                            {...field}
                            disabled={disableSettings}
                          />
                        )}
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
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
