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
import { ArtifactEditV3, ArtifactV3 } from '@edenlabs/eden-sdk'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  EyeIcon,
  FileTextIcon,
  XIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'

type ArtifactSidebarProps = {
  artifactId: string | null
  artifacts?: ArtifactV3[]
  isOpen: boolean
  onClose: () => void
  onSelectArtifact?: (artifactId: string) => void
}

const flattenItems = (
  items: Record<string, unknown>,
  prefix = '',
): Array<{ path: string; value: string }> => {
  const entries: Array<{ path: string; value: string }> = []
  for (const [key, value] of Object.entries(items)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      entries.push(...flattenItems(value as Record<string, unknown>, path))
      continue
    }
    if (typeof value === 'string') {
      entries.push({ path, value })
    } else if (value === null || value === undefined) {
      entries.push({ path, value: '' })
    } else {
      entries.push({ path, value: String(value) })
    }
  }
  return entries
}

const formatTimestamp = (value?: string | Date) => {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

const isHtmlContent = (content: string) => {
  const trimmed = content.trim()
  if (!trimmed.startsWith('<')) return false
  return /<\/[a-z][\s\S]*>/i.test(trimmed)
}

const renderPatch = (patch: ArtifactEditV3['patch']) => {
  if (!patch || patch.length === 0) return 'No changes'
  return patch
    .map(op => {
      if (op.op === 'unset') {
        return `${op.op.toUpperCase()} ${op.path}`
      }
      if (op.value === undefined) {
        return `${op.op.toUpperCase()} ${op.path}`
      }
      const value =
        typeof op.value === 'string' ? op.value : JSON.stringify(op.value)
      return `${op.op.toUpperCase()} ${op.path} = ${value}`
    })
    .join('\n')
}

export const ArtifactSidebar = ({
  artifactId,
  artifacts = [],
  isOpen,
  onClose,
  onSelectArtifact,
}: ArtifactSidebarProps) => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('content')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [contentExpanded, setContentExpanded] = useState(false)

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
  const contentValue = typeof items.content === 'string' ? items.content : ''
  const fieldEntries = useMemo(() => {
    const flattened = flattenItems(items).filter(
      entry => entry.path !== 'content',
    )
    return flattened.sort((a, b) => a.path.localeCompare(b.path))
  }, [items])

  const contentPreview =
    contentExpanded || contentValue.length <= 2000
      ? contentValue
      : `${contentValue.slice(0, 2000)}...`

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast({ title: `${label} copied` })
    } catch (error) {
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
                  <span className="text-foreground font-medium">Session:</span>{' '}
                  {artifact.session || '-'}
                </div>
                <div>
                  <span className="text-foreground font-medium">Updated:</span>{' '}
                  {formatTimestamp(artifact.updatedAt)}
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="fields">Fields</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="mt-4 space-y-3">
                  {contentValue ? (
                    <div className="rounded-lg border border-border bg-background/60">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-border text-xs text-muted-foreground">
                        <span>items.content</span>
                        <div className="flex items-center gap-2">
                          {isHtmlContent(contentValue) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => setIsPreviewOpen(prev => !prev)}
                            >
                              <EyeIcon className="w-3 h-3 mr-1" />
                              {isPreviewOpen ? 'Hide preview' : 'Preview'}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleCopy(contentValue, 'Content')}
                          >
                            <CopyIcon className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 space-y-3">
                        {isPreviewOpen && isHtmlContent(contentValue) && (
                          <div className="rounded-md overflow-hidden border border-border bg-white">
                            <iframe
                              title="Artifact preview"
                              sandbox=""
                              srcDoc={contentValue}
                              className="w-full h-64"
                            />
                          </div>
                        )}
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                          {contentPreview || 'No content'}
                        </pre>
                        {contentValue.length > 2000 && (
                          <button
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setContentExpanded(prev => !prev)}
                          >
                            {contentExpanded ? 'Collapse' : 'Expand'} content
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      No content stored yet.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="fields" className="mt-4">
                  {fieldEntries.length === 0 ? (
                    <div className="text-xs text-muted-foreground">
                      No additional fields stored yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {fieldEntries.map(entry => (
                        <div
                          key={entry.path}
                          className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs"
                        >
                          <div className="text-foreground font-medium">
                            {entry.path}
                          </div>
                          <div className="text-muted-foreground break-words">
                            {entry.value || '-'}
                          </div>
                        </div>
                      ))}
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
                      No edits recorded yet.
                    </div>
                  )}
                  {history.map((entry: ArtifactEditV3) => (
                    <div
                      key={entry._id}
                      className="rounded-md border border-border bg-background/70"
                    >
                      <div className="px-3 py-2 border-b border-border text-[11px] text-muted-foreground">
                        {formatTimestamp(entry.createdAt)} · {entry.actor}
                      </div>
                      <pre className="px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap break-words">
                        {renderPatch(entry.patch)}
                      </pre>
                    </div>
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
