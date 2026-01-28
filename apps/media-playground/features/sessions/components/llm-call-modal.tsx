'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GatedResource, useGatedResource } from '@/hooks/use-gated-resource'
import { cn } from '@/lib/utils'
import {
  BarChart3Icon,
  CheckIcon,
  ClockIcon,
  CodeIcon,
  CopyIcon,
  CpuIcon,
  FileTextIcon,
  Loader2Icon,
  MessageSquareIcon,
  ReplyIcon,
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
  session_run_id?: string
  message_id?: string
  message_observability?: {
    session_run_id?: string
    session_id?: string
    trace_id?: string
    generation_id?: string
    sentry_trace_id?: string
    langfuse_url?: string | null
    sentry_url?: string | null
    input_tokens?: number | null
    input_tokens_breakdown?: Record<string, number> | null
    [key: string]: unknown
  } | null
  request_payload?: {
    system?: string
    messages?: Array<{
      role: string
      // OpenAI tool message support
      tool_call_id?: string
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
  response_payload?: {
    content?:
      | string
      | Array<{
          type: string
          text?: string
          // Tool use in response
          id?: string
          name?: string
          input?: Record<string, unknown>
        }>
    // OpenAI-style tool_calls at response level
    tool_calls?: Array<{
      id?: string
      type?: string
      function?: {
        name: string
        arguments: string
      }
    }>
    stop?: string
    tokens_spent?: number
    prompt_tokens?: number
    completion_tokens?: number
    usage?: {
      prompt_tokens?: number
      completion_tokens?: number
      cached_prompt_tokens?: number
      cached_completion_tokens?: number
      total_tokens?: number
    }
    [key: string]: unknown
  }
  createdAt?: string
  completedAt?: string
  duration_ms?: number
  response?: unknown
  // Processed tool calls from the related Message document
  message_tool_calls?: Array<{
    id?: string
    tool?: string
    name?: string
    args?: Record<string, unknown>
    input?: Record<string, unknown>
    task?: string | { $oid: string }
    cost?: number
    status?: string
    result?: Array<{
      output?: Array<{
        message_id?: string
        recipients?: string[]
        type?: string
        status?: string
        [key: string]: unknown
      }>
      [key: string]: unknown
    }>
    error?: string | null
    child_session?: string | null
    reactions?: unknown
  }>
  message_content?: string
  finish_reason?: string
  [key: string]: unknown
}

interface LLMCallModalProps {
  llmCallId?: string | null
  observability?: {
    session_run_id?: string
    session_id?: string
    trace_id?: string
    generation_id?: string
    sentry_trace_id?: string | null
    langfuse_url?: string | null
    sentry_url?: string | null
  } | null
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
    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed w-full">
      {formatted}
    </pre>
  )
}

const getObservabilityLinks = (
  observability?: {
    session_run_id?: string
    sentry_trace_id?: string | null
    langfuse_url?: string | null
    sentry_url?: string | null
  } | null,
  fallbackSessionRunId?: string,
) => {
  const sessionRunId =
    observability?.session_run_id || fallbackSessionRunId || undefined
  const sentryTraceId = observability?.sentry_trace_id
  const langfuseBase = process.env.NEXT_PUBLIC_LANGFUSE_PROJECT_URL?.replace(
    /\/$/,
    '',
  )
  const sentryBase = process.env.NEXT_PUBLIC_SENTRY_TRACE_BASE_URL?.replace(
    /\/$/,
    '',
  )
  const langfuseUrl =
    (typeof observability?.langfuse_url === 'string'
      ? observability.langfuse_url
      : null) ||
    (sessionRunId && langfuseBase
      ? `${langfuseBase}/traces?peek=${encodeURIComponent(sessionRunId)}`
      : null)
  const sentryUrl =
    (typeof observability?.sentry_url === 'string'
      ? observability.sentry_url
      : null) ||
    (sentryTraceId && sentryBase ? `${sentryBase}/${sentryTraceId}` : null)

  return {
    sessionRunId,
    sentryTraceId,
    langfuseUrl,
    sentryUrl,
  }
}

const ObservabilityLinks = ({
  observability,
  sessionRunIdFallback,
}: {
  observability?: {
    session_run_id?: string
    sentry_trace_id?: string | null
    langfuse_url?: string | null
    sentry_url?: string | null
  } | null
  sessionRunIdFallback?: string
}) => {
  const { sessionRunId, sentryTraceId, langfuseUrl, sentryUrl } =
    getObservabilityLinks(observability, sessionRunIdFallback)

  if (!sessionRunId && !sentryTraceId && !langfuseUrl && !sentryUrl) {
    return null
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
        <TerminalSquareIcon className="w-3 h-3" />
        Observability
      </div>
      <div className="flex flex-wrap gap-2">
        {langfuseUrl && (
          <Button asChild variant="outline" size="sm">
            <a href={langfuseUrl} target="_blank" rel="noreferrer">
              Langfuse Trace
            </a>
          </Button>
        )}
        {sentryUrl && (
          <Button asChild variant="outline" size="sm">
            <a href={sentryUrl} target="_blank" rel="noreferrer">
              Sentry Trace
            </a>
          </Button>
        )}
      </div>
    </div>
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
  const observability = data.message_observability || null
  const sessionRunIdFallback = data.session_run_id || undefined

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

      <ObservabilityLinks
        observability={observability}
        sessionRunIdFallback={sessionRunIdFallback}
      />

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

const InputTokensTab = ({ data }: { data: LLMCallData }) => {
  const observability = data.message_observability || null
  const breakdown = observability?.input_tokens_breakdown || null
  const entries = breakdown
    ? Object.entries(breakdown).filter(
        ([, value]) => typeof value === 'number' && !Number.isNaN(value),
      )
    : []

  if (entries.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        No input token breakdown available
      </div>
    )
  }

  const totalFromBreakdown = entries.reduce((sum, [, value]) => sum + value, 0)
  const totalTokens =
    typeof observability?.input_tokens === 'number'
      ? observability.input_tokens
      : totalFromBreakdown

  return (
    <div className="h-full w-full overflow-auto space-y-3">
      <div className="rounded-lg border p-3">
        <div className="text-muted-foreground text-xs mb-1">
          Input Tokens Total
        </div>
        <div className="font-medium">{totalTokens.toLocaleString()}</div>
      </div>
      <div className="rounded-lg border p-3">
        <div className="text-muted-foreground text-xs mb-2">Breakdown</div>
        <div className="space-y-2">
          {entries
            .sort((a, b) => b[1] - a[1])
            .map(([category, value]) => (
              <div key={category} className="flex items-start gap-3">
                <div className="flex-1 font-mono text-xs break-all text-muted-foreground">
                  {category}
                </div>
                <div className="font-medium text-sm">
                  {value.toLocaleString()}
                </div>
              </div>
            ))}
        </div>
      </div>
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
    <div className="h-full w-full overflow-auto rounded-md border bg-muted/30 p-4">
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
    // Prefer url field if available (original image)
    if (block.source.url) {
      return (
        <div className="my-2">
          <img
            src={block.source.url}
            alt="Attached image"
            className="max-w-full max-h-48 rounded border object-contain"
          />
        </div>
      )
    }

    // Fall back to base64 data if it exists and isn't truncated
    // Truncated data is typically very short or doesn't have valid base64 content
    const hasValidBase64 =
      block.source.data &&
      block.source.data.length > 100 &&
      !block.source.data.includes('[truncated]')

    if (hasValidBase64) {
      return (
        <div className="my-2">
          <img
            src={`data:${block.source.media_type};base64,${block.source.data}`}
            alt="Attached image"
            className="max-w-full max-h-48 rounded border object-contain"
          />
        </div>
      )
    }

    // No valid image source available
    return (
      <div className="my-2 rounded border border-dashed border-muted-foreground/30 bg-muted/20 p-3 text-center text-sm text-muted-foreground">
        Image attachment unavailable (data truncated)
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
    <div className="h-full w-full overflow-auto space-y-3">
      {nonSystemMessages.map((msg, idx) => {
        const contentBlocks = Array.isArray(msg.content)
          ? msg.content
          : typeof msg.content === 'string'
          ? [{ type: 'text', text: msg.content }]
          : []

        return (
          <div key={idx} className="rounded-md border p-3 w-full">
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
            <div className="text-sm space-y-1 w-full">
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
    <div className="h-full w-full overflow-auto space-y-3">
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

// Response tab
const ResponseTab = ({ data }: { data: LLMCallData }) => {
  const response = data.response_payload

  if (!response) {
    return (
      <div className="text-muted-foreground text-center py-8">
        No response data available
      </div>
    )
  }

  const usage = response.usage || {}
  const hasUsage = Object.keys(usage).length > 0

  // Parse content - can be string or array of content blocks
  const contentBlocks = Array.isArray(response.content)
    ? response.content
    : typeof response.content === 'string'
    ? [{ type: 'text', text: response.content }]
    : []

  const textBlocks = contentBlocks.filter(b => b.type === 'text' && b.text)
  // Anthropic-style tool calls in content array
  const toolUseBlocks = contentBlocks.filter(b => b.type === 'tool_use')
  // OpenAI-style tool_calls at response level
  const openAIToolCalls = response.tool_calls || []

  // Processed tool calls from the Message document (with results)
  const messageToolCalls = data.message_tool_calls || []

  return (
    <div className="h-full w-full overflow-auto space-y-4">
      {/* Response text content */}
      {textBlocks.length > 0 && (
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <ReplyIcon className="w-3 h-3" />
            Response Content
          </div>
          <div className="rounded-md bg-muted/30 p-3">
            {textBlocks.map((block, idx) => (
              <FormattedText key={idx} text={block.text || ''} />
            ))}
          </div>
        </div>
      )}

      {/* Processed tool calls from Message (with full details and results) */}
      {messageToolCalls.length > 0 && (
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <WrenchIcon className="w-3 h-3" />
            Tool Calls ({messageToolCalls.length})
          </div>
          <div className="space-y-3">
            {messageToolCalls.map((toolCall, idx) => {
              const toolName = toolCall.tool || toolCall.name || 'Unknown'
              const args = toolCall.args || toolCall.input || {}
              const hasError = !!toolCall.error
              const statusColor =
                toolCall.status === 'completed'
                  ? 'text-green-500'
                  : toolCall.status === 'failed' || hasError
                  ? 'text-red-500'
                  : 'text-yellow-500'

              return (
                <div
                  key={idx}
                  className={cn(
                    'rounded border p-3',
                    hasError ? 'bg-red-500/10' : 'bg-purple-500/10',
                  )}
                >
                  {/* Header with tool name and status */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <WrenchIcon
                        className={cn(
                          'w-4 h-4',
                          hasError ? 'text-red-500' : 'text-purple-500',
                        )}
                      />
                      <span className="font-mono font-medium">{toolName}</span>
                    </div>
                    {toolCall.status && (
                      <span className={cn('text-xs font-medium', statusColor)}>
                        {toolCall.status}
                      </span>
                    )}
                  </div>

                  {/* Arguments */}
                  {Object.keys(args).length > 0 && (
                    <details className="text-xs mb-2" open>
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
                        Arguments
                      </summary>
                      <pre className="mt-1 p-2 bg-muted/50 rounded overflow-auto max-h-48 text-xs">
                        {JSON.stringify(args, null, 2)}
                      </pre>
                    </details>
                  )}

                  {/* Result */}
                  {toolCall.result && toolCall.result.length > 0 && (
                    <details className="text-xs" open>
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
                        Result
                      </summary>
                      <pre className="mt-1 p-2 bg-muted/50 rounded overflow-auto max-h-48 text-xs">
                        {JSON.stringify(toolCall.result, null, 2)}
                      </pre>
                    </details>
                  )}

                  {/* Error */}
                  {toolCall.error && (
                    <div className="mt-2 p-2 bg-red-500/20 rounded text-xs text-red-400">
                      <span className="font-medium">Error:</span>{' '}
                      {toolCall.error}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Raw tool_use blocks from LLM response (Anthropic format) - only show if no message tool calls */}
      {toolUseBlocks.length > 0 && messageToolCalls.length === 0 && (
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <WrenchIcon className="w-3 h-3" />
            Tool Calls ({toolUseBlocks.length})
          </div>
          <div className="space-y-2">
            {toolUseBlocks.map((block, idx) => (
              <div key={idx} className="rounded border bg-purple-500/10 p-2">
                <div className="flex items-center gap-2 mb-1">
                  <WrenchIcon className="w-3 h-3 text-purple-500" />
                  <span className="text-xs font-medium text-purple-500">
                    Tool Call
                  </span>
                  {block.name && (
                    <span className="font-mono text-xs">{block.name}</span>
                  )}
                </div>
                {/* Show input if available, otherwise show full block */}
                {block.input && Object.keys(block.input).length > 0 ? (
                  <details className="text-xs" open>
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Input
                    </summary>
                    <pre className="mt-1 p-2 bg-muted/50 rounded overflow-auto max-h-48 text-xs">
                      {JSON.stringify(block.input, null, 2)}
                    </pre>
                  </details>
                ) : (
                  <details className="text-xs" open>
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Details
                    </summary>
                    <pre className="mt-1 p-2 bg-muted/50 rounded overflow-auto max-h-48 text-xs">
                      {JSON.stringify(block, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tool calls in response (OpenAI format) - only show if no message tool calls */}
      {openAIToolCalls.length > 0 && messageToolCalls.length === 0 && (
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <WrenchIcon className="w-3 h-3" />
            Tool Calls ({openAIToolCalls.length})
          </div>
          <div className="space-y-2">
            {openAIToolCalls.map((toolCall, idx) => {
              // Parse arguments JSON string
              let parsedArgs: Record<string, unknown> | string = {}
              try {
                if (toolCall.function?.arguments) {
                  parsedArgs = JSON.parse(toolCall.function.arguments)
                }
              } catch {
                // Keep raw string if parsing fails
                parsedArgs = toolCall.function?.arguments || ''
              }

              return (
                <div key={idx} className="rounded border bg-purple-500/10 p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <WrenchIcon className="w-3 h-3 text-purple-500" />
                    <span className="text-xs font-medium text-purple-500">
                      Tool Call
                    </span>
                    {toolCall.function?.name && (
                      <span className="font-mono text-xs">
                        {toolCall.function.name}
                      </span>
                    )}
                  </div>
                  <details className="text-xs" open>
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Input
                    </summary>
                    <pre className="mt-1 p-2 bg-muted/50 rounded overflow-auto max-h-48 text-xs">
                      {typeof parsedArgs === 'string'
                        ? parsedArgs
                        : JSON.stringify(parsedArgs, null, 2)}
                    </pre>
                  </details>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Stop reason and token counts */}
      <div className="grid grid-cols-2 gap-4">
        {response.stop && (
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground text-xs mb-1">
              Stop Reason
            </div>
            <div className="font-medium font-mono text-sm">{response.stop}</div>
          </div>
        )}
        {response.tokens_spent !== undefined && (
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground text-xs mb-1">
              Tokens Spent
            </div>
            <div className="font-medium">
              {response.tokens_spent.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Token breakdown from response */}
      {(response.prompt_tokens !== undefined ||
        response.completion_tokens !== undefined) && (
        <div className="grid grid-cols-2 gap-4">
          {response.prompt_tokens !== undefined && (
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground text-xs mb-1">
                Prompt Tokens
              </div>
              <div className="font-medium">
                {response.prompt_tokens.toLocaleString()}
              </div>
            </div>
          )}
          {response.completion_tokens !== undefined && (
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground text-xs mb-1">
                Completion Tokens
              </div>
              <div className="font-medium">
                {response.completion_tokens.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed usage object */}
      {hasUsage && (
        <div className="rounded-lg border p-3">
          <div className="text-muted-foreground text-xs mb-2">
            Usage Details
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {usage.prompt_tokens !== undefined && (
              <div>
                <span className="text-muted-foreground">Prompt:</span>{' '}
                <span className="font-medium">
                  {usage.prompt_tokens.toLocaleString()}
                </span>
              </div>
            )}
            {usage.completion_tokens !== undefined && (
              <div>
                <span className="text-muted-foreground">Completion:</span>{' '}
                <span className="font-medium">
                  {usage.completion_tokens.toLocaleString()}
                </span>
              </div>
            )}
            {usage.total_tokens !== undefined && (
              <div>
                <span className="text-muted-foreground">Total:</span>{' '}
                <span className="font-medium">
                  {usage.total_tokens.toLocaleString()}
                </span>
              </div>
            )}
            {usage.cached_prompt_tokens !== undefined &&
              usage.cached_prompt_tokens > 0 && (
                <div>
                  <span className="text-muted-foreground">Cached Prompt:</span>{' '}
                  <span className="font-medium">
                    {usage.cached_prompt_tokens.toLocaleString()}
                  </span>
                </div>
              )}
            {usage.cached_completion_tokens !== undefined &&
              usage.cached_completion_tokens > 0 && (
                <div>
                  <span className="text-muted-foreground">
                    Cached Completion:
                  </span>{' '}
                  <span className="font-medium">
                    {usage.cached_completion_tokens.toLocaleString()}
                  </span>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  )
}

export const LLMCallModal = ({
  llmCallId,
  observability,
  isOpen,
  onClose,
}: LLMCallModalProps) => {
  const [data, setData] = useState<LLMCallData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const hasLlmCallId = Boolean(llmCallId)

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen && hasLlmCallId && !data && !isLoading) {
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
  }, [isOpen, llmCallId, hasLlmCallId, data, isLoading])

  const fallbackSessionRunId = observability?.session_run_id
  const showFallbackObservability =
    !data && (observability?.session_run_id || observability?.sentry_trace_id)

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
      <DialogContent className="w-[90vw] max-w-4xl h-[85vh] flex flex-col">
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

          {!hasLlmCallId && !data && !isLoading && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm gap-3">
              <div>LLM call not found for this message.</div>
              {showFallbackObservability && (
                <div className="w-full max-w-md">
                  <ObservabilityLinks
                    observability={observability ?? null}
                    sessionRunIdFallback={fallbackSessionRunId}
                  />
                </div>
              )}
            </div>
          )}

          {error && !data && (
            <div className="flex flex-col items-center justify-center py-8 text-destructive text-sm gap-3">
              <div>{error}</div>
              {showFallbackObservability && (
                <div className="w-full max-w-md text-muted-foreground">
                  <ObservabilityLinks
                    observability={observability ?? null}
                    sessionRunIdFallback={fallbackSessionRunId}
                  />
                </div>
              )}
            </div>
          )}

          {data && !isLoading && (
            <Tabs defaultValue="meta" className="flex-1 flex flex-col min-h-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-shrink-0 mb-2">
                <TabsList className="h-auto flex-wrap justify-start">
                  <TabsTrigger value="meta" className="gap-1.5">
                    <CpuIcon className="w-3 h-3" />
                    Meta
                  </TabsTrigger>
                  <TabsTrigger value="input-tokens" className="gap-1.5">
                    <BarChart3Icon className="w-3 h-3" />
                    Input Tokens
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
                  <TabsTrigger value="response" className="gap-1.5">
                    <ReplyIcon className="w-3 h-3" />
                    Response
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
                  className="gap-2 flex-shrink-0"
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

              <TabsContent value="meta" className="flex-1 min-h-0">
                <div className="h-full w-full overflow-auto">
                  <MetaTab data={data} />
                </div>
              </TabsContent>

              <TabsContent value="input-tokens" className="flex-1 min-h-0">
                <div className="h-full w-full overflow-auto">
                  <InputTokensTab data={data} />
                </div>
              </TabsContent>

              <TabsContent value="system" className="flex-1 min-h-0">
                <SystemTab data={data} />
              </TabsContent>

              <TabsContent value="messages" className="flex-1 min-h-0">
                <MessagesTab data={data} />
              </TabsContent>

              <TabsContent value="tools" className="flex-1 min-h-0">
                <ToolsTab data={data} />
              </TabsContent>

              <TabsContent value="response" className="flex-1 min-h-0">
                <ResponseTab data={data} />
              </TabsContent>

              <TabsContent value="raw" className="flex-1 min-h-0">
                <div className="h-full w-full overflow-auto rounded-md border bg-muted/30 p-4">
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
  llmCallId?: string | null
  observability?: {
    session_run_id?: string
    session_id?: string
    trace_id?: string
    generation_id?: string
    sentry_trace_id?: string | null
    langfuse_url?: string | null
    sentry_url?: string | null
  } | null
  className?: string
}

/**
 * Small button that opens the LLM Call modal when clicked
 */
export const LLMCallButton = ({
  llmCallId,
  observability,
  className,
}: LLMCallButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const { isAllowed } = useGatedResource(GatedResource.LlmCallDetails)

  if (!isAllowed) {
    return null
  }

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
        observability={observability}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
