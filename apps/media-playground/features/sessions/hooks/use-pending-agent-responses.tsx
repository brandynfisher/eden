import { Message } from '@edenlabs/eden-sdk'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type PendingAgentMap = Record<string, string[]>

export function usePendingAgentResponses({
  sessionId,
  messages,
}: {
  sessionId?: string
  messages?: Message[]
}) {
  const [pendingByRunId, setPendingByRunId] = useState<PendingAgentMap>({})
  const seenMessageIdsRef = useRef<Set<string>>(new Set())

  const resetPending = useCallback(() => {
    setPendingByRunId({})
    seenMessageIdsRef.current = new Set()
  }, [])

  useEffect(() => {
    resetPending()
  }, [sessionId, resetPending])

  const registerPendingAgents = useCallback(
    (sessionRunId: string, agentIds: string[]) => {
      if (!sessionRunId || agentIds.length === 0) return
      setPendingByRunId(prev => {
        const existing = new Set(prev[sessionRunId] ?? [])
        agentIds.forEach(id => existing.add(id))
        return {
          ...prev,
          [sessionRunId]: Array.from(existing),
        }
      })
    },
    [],
  )

  const resolvePendingAgent = useCallback(
    (sessionRunId: string, agentId: string) => {
      if (!sessionRunId || !agentId) return
      setPendingByRunId(prev => {
        const current = prev[sessionRunId]
        if (!current) return prev
        const nextAgents = current.filter(id => id !== agentId)
        if (nextAgents.length === 0) {
          const next = { ...prev }
          delete next[sessionRunId]
          return next
        }
        return {
          ...prev,
          [sessionRunId]: nextAgents,
        }
      })
    },
    [],
  )

  const resolveSinglePendingByAgent = useCallback((agentId: string) => {
    if (!agentId) return
    setPendingByRunId(prev => {
      const matchingRuns = Object.entries(prev).filter(([, agentIds]) =>
        agentIds.includes(agentId),
      )
      if (matchingRuns.length !== 1) {
        return prev
      }
      const [runId] = matchingRuns[0]
      const nextAgents = prev[runId].filter(id => id !== agentId)
      if (nextAgents.length === 0) {
        const next = { ...prev }
        delete next[runId]
        return next
      }
      return {
        ...prev,
        [runId]: nextAgents,
      }
    })
  }, [])

  useEffect(() => {
    if (!messages || messages.length === 0) return
    const seen = seenMessageIdsRef.current
    const newMessages = messages.filter(msg => msg?._id && !seen.has(msg._id))

    if (newMessages.length === 0) return

    const isRenderableAssistantMessage = (msg: Message) => {
      if (msg.role !== 'assistant') return false
      if (msg.content && msg.content.trim().length > 0) return true
      if (msg.attachments && msg.attachments.length > 0) return true
      if (msg.tool_calls && msg.tool_calls.length > 0) return true
      if ((msg as Message & { thought?: string }).thought) return true
      return false
    }

    newMessages.forEach(msg => {
      if (!msg?._id) return
      if (msg.role === 'assistant' && !isRenderableAssistantMessage(msg)) {
        return
      }
      seen.add(msg._id)
    })

    for (const msg of newMessages) {
      if (msg.role !== 'assistant') continue
      if (!isRenderableAssistantMessage(msg)) continue
      const senderId =
        typeof msg.sender === 'string' ? msg.sender : msg.sender?._id
      if (!senderId) continue

      const sessionRunId = (
        msg as Message & { observability?: { session_run_id?: string } }
      )?.observability?.session_run_id

      if (sessionRunId) {
        const pendingForRun = pendingByRunId[sessionRunId]
        if (pendingForRun?.includes(senderId)) {
          resolvePendingAgent(sessionRunId, senderId)
        } else {
          resolveSinglePendingByAgent(senderId)
        }
      } else {
        resolveSinglePendingByAgent(senderId)
      }
    }
  }, [
    messages,
    pendingByRunId,
    resolvePendingAgent,
    resolveSinglePendingByAgent,
  ])

  const pendingAgentIds = useMemo(() => {
    const ids = new Set<string>()
    Object.values(pendingByRunId).forEach(agentIds => {
      agentIds.forEach(id => ids.add(id))
    })
    return Array.from(ids)
  }, [pendingByRunId])

  return {
    pendingByRunId,
    pendingAgentIds,
    registerPendingAgents,
    resolvePendingAgent,
    resetPending,
  }
}
