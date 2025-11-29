'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  CheckIcon,
  ClockIcon,
  CodeIcon,
  CopyIcon,
  CpuIcon,
  FileTextIcon,
  Loader2Icon,
  MessageSquareIcon,
  TerminalSquareIcon,
  UserIcon,
  WrenchIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface LLMCallData {
  _id?: string
  model?: string
  provider?: string
  agent?: string | { _id?: string; name?: string; username?: string }
  session?: string
  request_payload?: {
    system?: string
    messages?: Array<{
      role: string
      content:
        | string
        | Array<{
            type: string
            text?: string
            // Image content
            source?: {
              type: string
              media_type?: string
              data?: string
              url?: string
            }
            // Tool use (assistant calling a tool)
            id?: string
            name?: string
            input?: Record<string, unknown>
            // Tool result
            tool_use_id?: string
            content?: string | Array<{ type: string; text?: string }>
            is_error?: boolean
          }>
    }>
    tools?: Array<{
      // Anthropic format (top-level)
      name?: string
      description?: string
      input_schema?: Record<string, unknown>
      // OpenAI format (nested)
      type?: string
      function?: {
        name: string
        description?: string
        parameters?: Record<string, unknown>
      }
    }>
  }
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
    input_tokens?: number
    output_tokens?: number
  }
  createdAt?: string
  completedAt?: string
  duration_ms?: number
  response?: unknown
  [key: string]: unknown
}

interface LLMCallModalProps {
  llmCallId: string
  isOpen: boolean
  onClose: () => void
}

// Helper to format duration
const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// Helper to format date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString()
}

// Helper to render text with proper newlines
const FormattedText = ({ text }: { text: string }) => {
  // Replace literal \n with actual newlines
  const formatted = text.replace(/\\n/g, '\n')
  return (
    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
      {formatted}
    </pre>
  )
}

// Meta tab content
const MetaTab = ({ data }: { data: LLMCallData }) => {
  const agentName =
    typeof data.agent === 'object'
      ? data.agent?.name || data.agent?.username || data.agent?._id
      : data.agent

  const usage = data.usage || {}
  const inputTokens = usage.input_tokens ?? usage.prompt_tokens ?? 0
  const outputTokens = usage.output_tokens ?? usage.completion_tokens ?? 0
  const totalTokens = usage.total_tokens ?? inputTokens + outputTokens

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <CpuIcon className="w-3 h-3" />
            Provider
          </div>
          <div className="font-medium">{data.provider || 'Unknown'}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <CpuIcon className="w-3 h-3" />
            Model
          </div>
          <div className="font-medium text-sm break-all">
            {data.model || 'Unknown'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <ClockIcon className="w-3 h-3" />
            Created
          </div>
          <div className="font-medium text-sm">
            {data.createdAt ? formatDate(data.createdAt) : 'Unknown'}
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <ClockIcon className="w-3 h-3" />
            Duration
          </div>
          <div className="font-medium">
            {data.duration_ms ? formatDuration(data.duration_ms) : 'Unknown'}
          </div>
        </div>
      </div>

      {agentName && (
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <UserIcon className="w-3 h-3" />
            Agent
          </div>
          <div className="font-medium">{agentName}</div>
        </div>
      )}

      {totalTokens > 0 && (
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <FileTextIcon className="w-3 h-3" />
            Token Usage
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Input:</span>{' '}
              <span className="font-medium">
                {inputTokens.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Output:</span>{' '}
              <span className="font-medium">
                {outputTokens.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total:</span>{' '}
              <span className="font-medium">
                {totalTokens.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// System message tab
const SystemTab = ({ data }: { data: LLMCallData }) => {
  // Check for system as direct string field first (Anthropic format)
  const systemString = data.request_payload?.system

  // Fall back to checking messages array (OpenAI format)
  const messages = data.request_payload?.messages || []
  const systemMessage = messages.find(m => m.role === 'system')

  const content = systemString
    ? systemString
    : systemMessage
    ? typeof systemMessage.content === 'string'
      ? systemMessage.content
      : Array.isArray(systemMessage.content)
      ? systemMessage.content
          .filter(c => c.type === 'text')
          .map(c => c.text)
          .join('\n')
      : ''
    : ''

  if (!content) {
    return (
      <div className="text-muted-foreground text-center py-8">
        No system message found
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-muted/30 p-4 overflow-auto max-h-[50vh]">
      <FormattedText text={content} />
    </div>
  )
}

// Content block renderer for messages
const ContentBlock = ({
  block,
}: {
  block: {
    type: string
    text?: string
    source?: {
      type: string
      media_type?: string
      data?: string
      url?: string
    }
    id?: string
    name?: string
    input?: Record<string, unknown>
    tool_use_id?: string
    content?: string | Array<{ type: string; text?: string }>
    is_error?: boolean
  }
}) => {
  // Text content
  if (block.type === 'text' && block.text) {
    return <FormattedText text={block.text} />
  }

  // Image content
  if (block.type === 'image' && block.source) {
    const src =
      block.source.type === 'base64'
        ? `data:${block.source.media_type};base64,${block.source.data}`
        : block.source.url
    return (
      <div className="my-2">
        <img
          src={src}
          alt="Attached image"
          className="max-w-full max-h-48 rounded border object-contain"
        />
      </div>
    )
  }

  // Tool use (assistant calling a tool)
  if (block.type === 'tool_use' && block.name) {
    return (
      <div className="my-2 rounded border bg-purple-500/10 p-2">
        <div className="flex items-center gap-2 mb-1">
          <WrenchIcon className="w-3 h-3 text-purple-500" />
          <span className="text-xs font-medium text-purple-500">Tool Call</span>
          <span className="font-mono text-xs">{block.name}</span>
        </div>
        {block.input && Object.keys(block.input).length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Input
            </summary>
            <pre className="mt-1 p-2 bg-muted/50 rounded overflow-auto text-xs">
              {JSON.stringify(block.input, null, 2)}
            </pre>
          </details>
        )}
      </div>
    )
  }

  // Tool result
  if (block.type === 'tool_result') {
    const rawContent =
      typeof block.content === 'string'
        ? block.content
        : Array.isArray(block.content)
        ? block.content
            .filter(c => c.type === 'text')
            .map(c => c.text)
            .join('\n')
        : ''

    // Try to parse and pretty-print as JSON
    let formattedContent = rawContent
    try {
      const parsed = JSON.parse(rawContent)
      formattedContent = JSON.stringify(parsed, null, 2)
    } catch {
      // Not JSON, use as-is
    }

    return (
      <div
        className={cn(
          'my-2 rounded border p-2',
          block.is_error ? 'bg-red-500/10' : 'bg-orange-500/10',
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <TerminalSquareIcon
            className={cn(
              'w-3 h-3',
              block.is_error ? 'text-red-500' : 'text-orange-500',
            )}
          />
          <span
            className={cn(
              'text-xs font-medium',
              block.is_error ? 'text-red-500' : 'text-orange-500',
            )}
          >
            {block.is_error ? 'Tool Error' : 'Tool Result'}
          </span>
        </div>
        {formattedContent && (
          <details className="text-xs" open>
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Output
            </summary>
            <pre className="mt-1 p-2 bg-muted/50 rounded overflow-auto max-h-48 text-xs">
              {formattedContent}
            </pre>
          </details>
        )}
      </div>
    )
  }

  // Unknown type - show as JSON
  return (
    <pre className="text-xs text-muted-foreground">
      {JSON.stringify(block, null, 2)}
    </pre>
  )
}

// Messages tab
const MessagesTab = ({ data }: { data: LLMCallData }) => {
  const messages = data.request_payload?.messages || []
  const nonSystemMessages = messages.filter(m => m.role !== 'system')

  if (nonSystemMessages.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        No messages found
      </div>
    )
  }

  return (
    <div className="space-y-3 overflow-auto max-h-[50vh]">
      {nonSystemMessages.map((msg, idx) => {
        const contentBlocks = Array.isArray(msg.content)
          ? msg.content
          : typeof msg.content === 'string'
          ? [{ type: 'text', text: msg.content }]
          : []

        return (
          <div key={idx} className="rounded-md border p-3">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded',
                  msg.role === 'user'
                    ? 'bg-blue-500/20 text-blue-500'
                    : msg.role === 'assistant'
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-gray-500/20 text-gray-500',
                )}
              >
                {msg.role}
              </span>
            </div>
            <div className="text-sm space-y-1">
              {contentBlocks.map((block, blockIdx) => (
                <ContentBlock key={blockIdx} block={block} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Tools tab
const ToolsTab = ({ data }: { data: LLMCallData }) => {
  const tools = data.request_payload?.tools || []

  if (tools.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        No tools defined
      </div>
    )
  }

  return (
    <div className="space-y-3 overflow-auto max-h-[50vh]">
      {tools.map((tool, idx) => {
        // Handle both Anthropic format (top-level) and OpenAI format (nested under function)
        const name = tool.name || tool.function?.name
        const description = tool.description || tool.function?.description
        const parameters = tool.input_schema || tool.function?.parameters

        if (!name) return null

        return (
          <details key={idx} className="rounded-md border">
            <summary className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50">
              <WrenchIcon className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{name}</span>
            </summary>
            <div className="px-3 pb-3 space-y-2">
              {description && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Description
                  </div>
                  <div className="p-2 bg-muted/50 rounded text-sm text-muted-foreground">
                    <FormattedText text={description} />
                  </div>
                </div>
              )}
              {parameters && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Parameters
                  </div>
                  <pre className="p-2 bg-muted/50 rounded overflow-auto text-xs">
                    {JSON.stringify(parameters, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )
      })}
    </div>
  )
}

export const LLMCallModal = ({
  llmCallId,
  isOpen,
  onClose,
}: LLMCallModalProps) => {
  const [data, setData] = useState<LLMCallData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen && !data && !isLoading) {
      const fetchData = async () => {
        setIsLoading(true)
        setError(null)
        try {
          const response = await fetch(`/api/llm-calls/${llmCallId}`)
          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(errorText || 'Failed to fetch LLM call data')
          }
          const result = await response.json()
          setData(result)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load data')
        } finally {
          setIsLoading(false)
        }
      }
      fetchData()
    }
  }, [isOpen, llmCallId, data, isLoading])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  const handleCopy = async () => {
    if (data) {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <TerminalSquareIcon className="w-5 h-5" />
            LLM Call Details
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12 text-destructive">
              {error}
            </div>
          )}

          {data && !isLoading && (
            <Tabs defaultValue="meta" className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between flex-shrink-0 mb-2">
                <TabsList>
                  <TabsTrigger value="meta" className="gap-1.5">
                    <CpuIcon className="w-3 h-3" />
                    Meta
                  </TabsTrigger>
                  <TabsTrigger value="system" className="gap-1.5">
                    <FileTextIcon className="w-3 h-3" />
                    System
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="gap-1.5">
                    <MessageSquareIcon className="w-3 h-3" />
                    Messages
                  </TabsTrigger>
                  <TabsTrigger value="tools" className="gap-1.5">
                    <WrenchIcon className="w-3 h-3" />
                    Tools
                  </TabsTrigger>
                  <TabsTrigger value="raw" className="gap-1.5">
                    <CodeIcon className="w-3 h-3" />
                    Raw
                  </TabsTrigger>
                </TabsList>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-4 h-4" />
                      Copy JSON
                    </>
                  )}
                </Button>
              </div>

              <TabsContent value="meta" className="flex-1 overflow-auto">
                <MetaTab data={data} />
              </TabsContent>

              <TabsContent value="system" className="flex-1 overflow-auto">
                <SystemTab data={data} />
              </TabsContent>

              <TabsContent value="messages" className="flex-1 overflow-auto">
                <MessagesTab data={data} />
              </TabsContent>

              <TabsContent value="tools" className="flex-1 overflow-auto">
                <ToolsTab data={data} />
              </TabsContent>

              <TabsContent value="raw" className="flex-1 overflow-auto">
                <div className="rounded-md border bg-muted/30 p-4 overflow-auto max-h-[50vh]">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface LLMCallButtonProps {
  llmCallId: string
  className?: string
}

/**
 * Small button that opens the LLM Call modal when clicked
 */
export const LLMCallButton = ({ llmCallId, className }: LLMCallButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'p-1.5 rounded hover:bg-muted transition-colors',
          'text-muted-foreground hover:text-foreground',
          className,
        )}
        title="View raw LLM call"
      >
        <TerminalSquareIcon className="w-3.5 h-3.5" />
      </button>
      <LLMCallModal
        llmCallId={llmCallId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
