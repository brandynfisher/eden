'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { useArtifactV3HistoryQuery } from '@/hooks/query/use-artifact-v3-history-query'
import { useArtifactV3Query } from '@/hooks/query/use-artifact-v3-query'
import { cn } from '@/lib/utils'
import { ArtifactV3, ArtifactVersionV3 } from '@edenlabs/eden-sdk'
import {
  ChevronRightIcon as ChevronClosedIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  FileTextIcon,
  XIcon,
} from 'lucide-react'
import { MouseEvent, useMemo, useState } from 'react'

type ArtifactSidebarProps = {
  artifactId: string | null
  artifacts?: ArtifactV3[]
  isOpen: boolean
  onClose: () => void
  onSelectArtifact?: (artifactId: string) => void
}

const formatTimestamp = (value?: string | Date) => {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

type JsonPatchOp = {
  op: 'add' | 'remove' | 'replace'
  path: string
  value?: unknown
}

const formatOperation = (op: JsonPatchOp): string => {
  const valueStr =
    op.value !== undefined ? JSON.stringify(op.value, null, 0) : ''
  const truncatedValue =
    valueStr.length > 60 ? valueStr.slice(0, 60) + '...' : valueStr

  switch (op.op) {
    case 'add':
      return `+ ${op.path} = ${truncatedValue}`
    case 'remove':
      return `- ${op.path}`
    case 'replace':
      return `~ ${op.path} = ${truncatedValue}`
    default:
      return `${op.op} ${op.path}`
  }
}

type JsonValueProps = {
  value: unknown
  path: string
  depth?: number
  defaultExpanded?: boolean
}

const JsonValue = ({
  value,
  path,
  depth = 0,
  defaultExpanded = true,
}: JsonValueProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded && depth < 2)
  const { toast } = useToast()

  const handleCopy = async (e: MouseEvent) => {
    e.stopPropagation()
    try {
      const text =
        typeof value === 'string' ? value : JSON.stringify(value, null, 2)
      await navigator.clipboard.writeText(text)
      toast({ title: 'Copied to clipboard' })
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' })
    }
  }

  if (value === null) {
    return <span className="text-muted-foreground italic">null</span>
  }

  if (value === undefined) {
    return <span className="text-muted-foreground italic">undefined</span>
  }

  if (typeof value === 'boolean') {
    return <span className="text-blue-400">{value ? 'true' : 'false'}</span>
  }

  if (typeof value === 'number') {
    return <span className="text-green-400">{value}</span>
  }

  if (typeof value === 'string') {
    if (value.length > 200) {
      return (
        <div className="group">
          <span className="text-amber-300">
            &quot;{value.slice(0, 200)}...&quot;
          </span>
          <button
            onClick={handleCopy}
            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <CopyIcon className="w-3 h-3 inline text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      )
    }
    return <span className="text-amber-300">&quot;{value}&quot;</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground">[]</span>
    }

    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronDownIcon className="w-3 h-3" />
          ) : (
            <ChevronClosedIcon className="w-3 h-3" />
          )}
          <span className="text-purple-400">Array</span>
          <span className="text-muted-foreground text-[10px]">
            ({value.length} items)
          </span>
        </button>
        {isExpanded && (
          <div
            className={cn(
              'mt-1 space-y-1 border-l border-border',
              depth === 0 ? 'ml-1 pl-2' : 'ml-3 pl-2',
            )}
          >
            {value.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground text-[10px] mt-0.5 min-w-[16px]">
                  {index}
                </span>
                <div className="flex-1 min-w-0">
                  <JsonValue
                    value={item}
                    path={`${path}/${index}`}
                    depth={depth + 1}
                    defaultExpanded={depth < 1}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 0) {
      return <span className="text-muted-foreground">{'{}'}</span>
    }

    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronDownIcon className="w-3 h-3" />
          ) : (
            <ChevronClosedIcon className="w-3 h-3" />
          )}
          <span className="text-cyan-400">Object</span>
          <span className="text-muted-foreground text-[10px]">
            ({entries.length} keys)
          </span>
        </button>
        {isExpanded && (
          <div
            className={cn(
              'mt-1 space-y-1 border-l border-border',
              depth === 0 ? 'ml-1 pl-2' : 'ml-3 pl-2',
            )}
          >
            {entries.map(([key, val]) => (
              <div key={key} className="flex items-start gap-2">
                <span className="text-foreground font-medium text-xs min-w-0 shrink-0">
                  {key}:
                </span>
                <div className="flex-1 min-w-0">
                  <JsonValue
                    value={val}
                    path={`${path}/${key}`}
                    depth={depth + 1}
                    defaultExpanded={depth < 1}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return <span className="text-muted-foreground">{String(value)}</span>
}

type HistoryEntryProps = {
  entry: ArtifactVersionV3
}

const HistoryEntry = ({ entry }: HistoryEntryProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const items = (entry.items || {}) as Record<string, unknown>
  const operations = (entry.operations || []) as JsonPatchOp[]
  const hasItems = Object.keys(items).length > 0
  const hasOperations = operations.length > 0
  const isInitialVersion = entry.version === 1

  return (
    <div className="rounded-md border border-border bg-background/70">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 border-b border-border text-[11px] text-muted-foreground flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {hasItems &&
            (isExpanded ? (
              <ChevronDownIcon className="w-3 h-3" />
            ) : (
              <ChevronRightIcon className="w-3 h-3" />
            ))}
          <span>{formatTimestamp(entry.createdAt)}</span>
        </div>
        <span className="font-medium">v{entry.version}</span>
      </button>
      <div className="px-3 py-2 text-xs">
        {entry.reason && (
          <div className="mb-2 font-medium text-foreground">{entry.reason}</div>
        )}
        {!isExpanded && hasOperations && (
          <div className="space-y-1 font-mono text-[10px]">
            {operations.slice(0, 3).map((op, i) => (
              <div
                key={i}
                className={cn(
                  op.op === 'add' && 'text-green-400',
                  op.op === 'remove' && 'text-red-400',
                  op.op === 'replace' && 'text-amber-400',
                )}
              >
                {formatOperation(op)}
              </div>
            ))}
            {operations.length > 3 && (
              <div className="text-muted-foreground">
                +{operations.length - 3} more operations
              </div>
            )}
          </div>
        )}
        {!isExpanded && !hasOperations && isInitialVersion && hasItems && (
          <div className="text-muted-foreground text-[10px]">
            Initial data: {Object.keys(items).length} keys
          </div>
        )}
        {!isExpanded && !hasOperations && !isInitialVersion && hasItems && (
          <div className="text-muted-foreground text-[10px]">
            Snapshot: {Object.keys(items).length} keys
          </div>
        )}
        {isExpanded && hasItems && (
          <div className="mt-2 rounded border border-border bg-background/60 p-2 text-xs overflow-x-auto">
            {hasOperations && (
              <div className="mb-3 pb-2 border-b border-border">
                <div className="text-[10px] text-muted-foreground mb-1">
                  Operations:
                </div>
                <div className="space-y-1 font-mono text-[10px]">
                  {operations.map((op, i) => (
                    <div
                      key={i}
                      className={cn(
                        op.op === 'add' && 'text-green-400',
                        op.op === 'remove' && 'text-red-400',
                        op.op === 'replace' && 'text-amber-400',
                      )}
                    >
                      {formatOperation(op)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="text-[10px] text-muted-foreground mb-1">
              Full snapshot:
            </div>
            {Object.entries(items).map(([key, value]) => (
              <div key={key} className="mb-2 last:mb-0">
                <div className="flex items-start gap-2">
                  <span className="text-foreground font-semibold shrink-0">
                    {key}:
                  </span>
                  <div className="flex-1 min-w-0">
                    <JsonValue
                      value={value}
                      path={`/${key}`}
                      depth={0}
                      defaultExpanded={false}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!hasItems && (
          <div className="text-muted-foreground italic">Empty snapshot</div>
        )}
      </div>
    </div>
  )
}

export const ArtifactSidebar = ({
  artifactId,
  artifacts = [],
  isOpen,
  onClose,
  onSelectArtifact,
}: ArtifactSidebarProps) => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('data')

  const { artifact, isLoading } = useArtifactV3Query({
    artifactId,
    enabled: isOpen && !!artifactId,
  })

  const { history, isLoading: isHistoryLoading } = useArtifactV3HistoryQuery({
    artifactId,
    enabled: isOpen && !!artifactId && activeTab === 'history',
    page: 1,
    limit: 20,
  })

  const artifactOptions = useMemo(() => {
    const map = new Map<string, ArtifactV3>()
    artifacts.forEach(item => {
      map.set(item._id, item)
    })
    if (artifact && !map.has(artifact._id)) {
      map.set(artifact._id, artifact)
    }
    return Array.from(map.values())
  }, [artifacts, artifact])

  const selectedId = artifact?._id || artifactId || null
  const selectedIndex = useMemo(() => {
    if (!selectedId) return -1
    return artifactOptions.findIndex(option => option._id === selectedId)
  }, [artifactOptions, selectedId])
  const canGoPrev = selectedIndex > 0
  const canGoNext =
    selectedIndex >= 0 && selectedIndex < artifactOptions.length - 1

  const items = (artifact?.items as Record<string, unknown>) || {}

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(items, null, 2))
      toast({ title: 'Items copied to clipboard' })
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Your browser blocked clipboard access.',
        variant: 'destructive',
      })
    }
  }

  const handleSelect = (value: string) => {
    if (value && value !== selectedId) {
      onSelectArtifact?.(value)
    }
  }

  const handlePrev = () => {
    if (canGoPrev) {
      onSelectArtifact?.(artifactOptions[selectedIndex - 1]._id)
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      onSelectArtifact?.(artifactOptions[selectedIndex + 1]._id)
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col bg-background border-l border-border flex-shrink-0',
        'transition-all duration-300 ease-out',
        isOpen
          ? 'w-full sm:w-[420px] lg:w-[460px] opacity-100'
          : 'w-0 opacity-0 overflow-hidden',
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border">
            <FileTextIcon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Artifact
            </div>
            <div className="text-sm font-semibold truncate">
              {artifact?.title || 'No artifact selected'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {artifactOptions.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                disabled={!canGoPrev}
                className={cn(
                  'p-1 rounded-md transition-colors',
                  canGoPrev
                    ? 'hover:bg-muted text-muted-foreground'
                    : 'opacity-40 text-muted-foreground',
                )}
                aria-label="Previous artifact"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className={cn(
                  'p-1 rounded-md transition-colors',
                  canGoNext
                    ? 'hover:bg-muted text-muted-foreground'
                    : 'opacity-40 text-muted-foreground',
                )}
                aria-label="Next artifact"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
          {artifactOptions.length > 1 && (
            <Select value={selectedId || ''} onValueChange={handleSelect}>
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue placeholder="Select artifact" />
              </SelectTrigger>
              <SelectContent>
                {artifactOptions.map(option => (
                  <SelectItem key={option._id} value={option._id}>
                    {option.title || option._id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <XIcon className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {isLoading && (
            <div className="text-sm text-muted-foreground">Loading...</div>
          )}

          {!isLoading && !artifact && (
            <div className="text-sm text-muted-foreground">
              Select an artifact to view details.
            </div>
          )}

          {artifact && (
            <>
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
                <div>
                  <span className="text-foreground font-medium">Type:</span>{' '}
                  {artifact.type || '-'}
                </div>
                <div>
                  <span className="text-foreground font-medium">
                    Visibility:
                  </span>{' '}
                  {artifact.public ? 'Public' : 'Private'}
                </div>
                <div>
                  <span className="text-foreground font-medium">Version:</span>{' '}
                  {artifact.version || 1}
                </div>
                <div>
                  <span className="text-foreground font-medium">Session:</span>{' '}
                  {artifact.session || '-'}
                </div>
                <div>
                  <span className="text-foreground font-medium">Updated:</span>{' '}
                  {formatTimestamp(artifact.updatedAt)}
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="data">Data</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="data" className="mt-4">
                  {Object.keys(items).length === 0 ? (
                    <div className="text-xs text-muted-foreground">
                      No data stored yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {Object.keys(items).length} top-level keys
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={handleCopyAll}
                        >
                          <CopyIcon className="w-3 h-3 mr-1" />
                          Copy JSON
                        </Button>
                      </div>
                      <div className="rounded-lg border border-border bg-background/60 p-3 text-xs overflow-x-auto">
                        {Object.entries(items).map(([key, value]) => (
                          <div key={key} className="mb-3 last:mb-0">
                            <div className="flex items-start gap-2">
                              <span className="text-foreground font-semibold shrink-0">
                                {key}:
                              </span>
                              <div className="flex-1 min-w-0">
                                <JsonValue
                                  value={value}
                                  path={`/${key}`}
                                  depth={0}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="mt-4 space-y-3">
                  {isHistoryLoading && (
                    <div className="text-xs text-muted-foreground">
                      Loading history...
                    </div>
                  )}
                  {!isHistoryLoading && history.length === 0 && (
                    <div className="text-xs text-muted-foreground">
                      No version history yet.
                    </div>
                  )}
                  {history.map((entry: ArtifactVersionV3) => (
                    <HistoryEntry key={entry._id} entry={entry} />
                  ))}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
