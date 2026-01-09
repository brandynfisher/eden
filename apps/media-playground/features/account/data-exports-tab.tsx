'use client'

import AgentSelectorModal from '@/components/modal/agent-selector-modal'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { handleAxiosServerError } from '@/lib/fetcher'
import { convertBytes } from '@/lib/files'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import {
  Agent,
  DataExport,
  ExportEstimate,
  ExportsCreateArguments,
} from '@edenlabs/eden-sdk'
import axios from 'axios'
import { DownloadIcon, Loader2, Plus, XCircle, XIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const mediaTypeOptions = [
  { key: 'images', label: 'Images' },
  { key: 'videos', label: 'Videos' },
  { key: 'audio', label: 'Audio' },
] as const

type MediaTypeKey = (typeof mediaTypeOptions)[number]['key']

const timeRangeOptions = [
  { key: '1d', label: '1 day' },
  { key: '1w', label: '1 week' },
  { key: '30d', label: '30 days' },
  { key: '1y', label: '1 year' },
  { key: 'all', label: 'All time' },
] as const

type TimeRangeKey = (typeof timeRangeOptions)[number]['key']

const statusVariantMap: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  queued: 'secondary',
  running: 'secondary',
  completed: 'default',
  failed: 'destructive',
  expired: 'outline',
  cancelled: 'outline',
}

const EXPORTS_REFRESH_INTERVAL_MS = 15000
const EXPORTS_PAGE_SIZE = 5

const normalizeEstimateValue = (value: unknown) => {
  const numberValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : 0
}

const normalizeEstimate = (
  raw: ExportEstimate | undefined | null,
): ExportEstimate | null => {
  if (!raw) return null
  return {
    sessions: normalizeEstimateValue(raw.sessions),
    messages: normalizeEstimateValue(raw.messages),
    creations: normalizeEstimateValue(raw.creations),
    files: normalizeEstimateValue(raw.files),
    bytes: normalizeEstimateValue(raw.bytes),
  }
}

const DataExportsTab = () => {
  const [exports, setExports] = useState<DataExport[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEstimating, setIsEstimating] = useState(false)
  const [estimateOpen, setEstimateOpen] = useState(false)
  const [estimate, setEstimate] = useState<ExportEstimate | null>(null)
  const [estimateMeta, setEstimateMeta] = useState<{
    over_limit?: boolean
    over_limit_reason?: string | null
    limits?: { max_files: number; max_bytes: number }
  } | null>(null)
  const [pendingPayload, setPendingPayload] =
    useState<ExportsCreateArguments | null>(null)

  const [includeChats, setIncludeChats] = useState(true)
  const [includeMediaFiles, setIncludeMediaFiles] = useState(true)
  const [mediaTypes, setMediaTypes] = useState<MediaTypeKey[]>([
    'images',
    'videos',
    'audio',
  ])
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('30d')
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([])

  const selectedMediaTypes = useMemo(() => {
    return mediaTypes
  }, [mediaTypes])

  const fetchExports = useCallback(
    async ({
      showLoading = true,
      page = currentPage,
    }: { showLoading?: boolean; page?: number } = {}) => {
      try {
        if (showLoading) {
          setIsLoading(true)
        }
        const response = await axios.get('/api/exports', {
          params: {
            limit: EXPORTS_PAGE_SIZE,
            offset: (page - 1) * EXPORTS_PAGE_SIZE,
          },
        })
        const data = response.data
        if (data?.exports) {
          setExports(data.exports)
          setTotalCount(data.total_count ?? data.exports.length)
          const totalPages = Math.max(
            1,
            Math.ceil(
              (data.total_count ?? data.exports.length) / EXPORTS_PAGE_SIZE,
            ),
          )
          if (page > totalPages) {
            setCurrentPage(totalPages)
          }
        }
      } catch (error) {
        if (showLoading) {
          const message = handleAxiosServerError(error)
          toast.error(message)
        }
      } finally {
        if (showLoading) {
          setIsLoading(false)
        }
      }
    },
    [currentPage],
  )

  useEffect(() => {
    void fetchExports({ page: currentPage })
  }, [fetchExports, currentPage])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetchExports({ showLoading: false, page: currentPage })
    }, EXPORTS_REFRESH_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [fetchExports, currentPage])

  const handleRemoveAgent = (agentId: string) => {
    setSelectedAgents(prev => prev.filter(agent => agent._id !== agentId))
  }

  const handleClearAgents = () => {
    setSelectedAgents([])
  }

  const selectedAgentIds = selectedAgents.map(agent => agent._id)

  const buildDateRangePayload = () => {
    if (timeRange === 'all') {
      return { created_after: null, created_before: null }
    }

    const now = new Date()
    const start = new Date(now)

    switch (timeRange) {
      case '1d':
        start.setDate(start.getDate() - 1)
        break
      case '1w':
        start.setDate(start.getDate() - 7)
        break
      case '30d':
        start.setDate(start.getDate() - 30)
        break
      case '1y':
        start.setFullYear(start.getFullYear() - 1)
        break
    }

    return {
      created_after: start.toISOString(),
      created_before: now.toISOString(),
    }
  }

  const buildExportPayload = (): ExportsCreateArguments => {
    const dateRangePayload = buildDateRangePayload()
    return {
      include_chats: includeChats,
      include_media_files: includeMediaFiles,
      media_types: includeMediaFiles ? selectedMediaTypes : [],
      agent_ids: selectedAgentIds,
      ...dateRangePayload,
    }
  }

  const handleCreateExport = async () => {
    if (
      !includeChats &&
      (!includeMediaFiles || selectedMediaTypes.length === 0)
    ) {
      toast.error('Select chats and/or at least one media type.')
      return
    }

    try {
      setIsEstimating(true)
      const payload = buildExportPayload()
      const response = await axios.post('/api/exports/estimate', payload)
      const data = response.data
      const normalizedEstimate = normalizeEstimate(data?.estimate)
      if (!normalizedEstimate) {
        toast.error('Unable to estimate export.')
        return
      }
      setEstimate(normalizedEstimate)
      setEstimateMeta({
        over_limit: data.over_limit,
        over_limit_reason: data.over_limit_reason,
        limits: data.limits,
      })
      setPendingPayload(payload)
      setEstimateOpen(true)
    } catch (error) {
      const message = handleAxiosServerError(error)
      toast.error(message)
    } finally {
      setIsEstimating(false)
    }
  }

  const handleConfirmExport = async () => {
    if (!pendingPayload) return
    try {
      setIsSubmitting(true)
      await axios.post('/api/exports', pendingPayload)
      toast.success('Export requested. We’ll notify you when it’s ready.')
      setEstimateOpen(false)
      setEstimate(null)
      setEstimateMeta(null)
      setPendingPayload(null)
      setCurrentPage(1)
      fetchExports({ page: 1 })
    } catch (error) {
      const message = handleAxiosServerError(error)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownload = async (exportId: string) => {
    try {
      const response = await axios.post(`/api/exports/${exportId}/download`)
      if (response.data?.url) {
        window.open(response.data.url, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      const message = handleAxiosServerError(error)
      toast.error(message)
    }
  }

  const handleCancel = async (exportId: string) => {
    try {
      await axios.post(`/api/exports/${exportId}/cancel`)
      toast.success('Export cancelled.')
      fetchExports()
    } catch (error) {
      const message = handleAxiosServerError(error)
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Request export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              <Label className="text-sm font-medium">Include</Label>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Chats</p>
                  <p className="text-xs text-muted-foreground">
                    Full session transcripts as JSON.
                  </p>
                </div>
                <Switch
                  checked={includeChats}
                  onCheckedChange={setIncludeChats}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Media files</p>
                  <p className="text-xs text-muted-foreground">
                    Media files you have created on Eden.
                  </p>
                </div>
                <Switch
                  checked={includeMediaFiles}
                  onCheckedChange={setIncludeMediaFiles}
                />
              </div>
              {!includeMediaFiles && (
                <p className="text-xs text-muted-foreground">
                  Metadata-only export: media files will be excluded.
                </p>
              )}
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <Label className="text-sm font-medium">Media types</Label>
              <p className="text-xs text-muted-foreground">
                Choose which files to bundle with your export.
              </p>
              <div
                className={
                  !includeMediaFiles
                    ? 'opacity-50 pointer-events-none'
                    : undefined
                }
              >
                <div className="space-y-3">
                  {mediaTypeOptions.map(option => (
                    <div
                      key={option.key}
                      className="flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-medium">{option.label}</p>
                      </div>
                      <Switch
                        checked={mediaTypes.includes(option.key)}
                        onCheckedChange={checked => {
                          setMediaTypes(prev =>
                            checked
                              ? [...prev, option.key]
                              : prev.filter(type => type !== option.key),
                          )
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3 md:col-span-2">
              <Label className="text-sm font-medium">Time period</Label>
              <p className="text-xs text-muted-foreground">
                Defaults to the last 30 days.
              </p>
              <Select
                value={timeRange}
                onValueChange={value => setTimeRange(value as TimeRangeKey)}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  {timeRangeOptions.map(option => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Label className="text-sm font-medium">Filter by agent</Label>
                <p className="text-xs text-muted-foreground">
                  Optional. Limit exports to sessions and creations that include
                  specific agents.
                </p>
              </div>
              <AgentSelectorModal
                className="p-4 md:p-8 w-full"
                title="Select Agents"
                description="Pick any of your agents or public agents to filter this export."
                selectedAgents={selectedAgents}
                onChange={setSelectedAgents}
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Select agents
                  </Button>
                }
              />
            </div>

            {selectedAgents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No agent filter applied. Your export will include all eligible
                data.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedAgents.map(agent => (
                    <div
                      key={agent._id}
                      className="flex items-center gap-3 rounded-md border bg-muted/20 p-2"
                    >
                      <Avatar className="h-9 w-9 border border-primary/20">
                        <AvatarImage
                          src={
                            agent.userImage && agent.userImage.trim()
                              ? getCloudfrontOriginalUrl(agent.userImage)
                              : undefined
                          }
                          alt={agent.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-xs font-medium">
                          {agent.name?.slice(0, 2).toUpperCase() || 'AG'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {agent.name || agent.username || agent._id}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {agent.owner?.username
                            ? `by @${agent.owner.username}`
                            : agent.username
                            ? `@${agent.username}`
                            : 'Public agent'}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAgent(agent._id)}
                        className="hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAgents}
                  className="w-fit"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button
            onClick={handleCreateExport}
            disabled={isSubmitting || isEstimating}
          >
            {isSubmitting || isEstimating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Create export'
            )}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={estimateOpen} onOpenChange={setEstimateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review export summary</DialogTitle>
            <DialogDescription>
              Confirm the data included in this export before it starts.
            </DialogDescription>
          </DialogHeader>
          {estimate ? (
            <div className="space-y-3 text-sm">
              {estimate.sessions +
                estimate.messages +
                estimate.creations +
                estimate.files ===
                0 && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-500 text-xs">
                  No data found for the selected filters. Adjust your filters to
                  create an export.
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sessions</span>
                <span className="font-medium">
                  {new Intl.NumberFormat().format(estimate.sessions)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Messages</span>
                <span className="font-medium">
                  {new Intl.NumberFormat().format(estimate.messages)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Creations</span>
                <span className="font-medium">
                  {new Intl.NumberFormat().format(estimate.creations)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Files</span>
                <span className="font-medium">
                  {new Intl.NumberFormat().format(estimate.files)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estimated size</span>
                <span className="font-medium">
                  {convertBytes(estimate.bytes, { useBinaryUnits: true })}
                </span>
              </div>
              {estimateMeta?.over_limit && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-xs">
                  {estimateMeta.over_limit_reason ||
                    'Estimated export exceeds limits. Try a metadata-only export.'}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Unable to calculate export summary.
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEstimateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmExport}
              disabled={
                Boolean(estimateMeta?.over_limit) ||
                isSubmitting ||
                (estimate
                  ? estimate.sessions +
                      estimate.messages +
                      estimate.creations +
                      estimate.files ===
                    0
                  : true)
              }
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Start export'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Exports</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchExports({ page: currentPage })}
          >
            Refresh
          </Button>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {totalCount === 0
              ? 'No exports yet.'
              : `Showing ${
                  (currentPage - 1) * EXPORTS_PAGE_SIZE + 1
                }-${Math.min(
                  currentPage * EXPORTS_PAGE_SIZE,
                  totalCount,
                )} of ${totalCount}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(prev =>
                  Math.min(
                    Math.max(1, Math.ceil(totalCount / EXPORTS_PAGE_SIZE)),
                    prev + 1,
                  ),
                )
              }
              disabled={
                currentPage >=
                Math.max(1, Math.ceil(totalCount / EXPORTS_PAGE_SIZE))
              }
            >
              Next
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : exports.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No exports yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          exports.map(item => (
            <Card key={item._id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">
                    Export {item._id.slice(0, 8)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant={statusVariantMap[item.status] || 'outline'}>
                  {item.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Chats: {item.filters?.include_chats ? 'Yes' : 'No'} · Media
                  files: {item.filters?.include_media_files ? 'Yes' : 'No'}
                </p>
                {item.counts && (
                  <p>
                    Sessions: {item.counts.sessions} · Creations:{' '}
                    {item.counts.creations} · Files: {item.counts.files}
                  </p>
                )}
                {item.error && (
                  <p className="text-destructive">Error: {item.error}</p>
                )}
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                {item.status === 'completed' && (
                  <Button size="sm" onClick={() => handleDownload(item._id)}>
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
                {['queued', 'running'].includes(item.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancel(item._id)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default DataExportsTab
