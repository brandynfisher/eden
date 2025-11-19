'use client'

import { DevPanel } from './components/dev-panel'
import { StatusIndicator } from './components/status-indicator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AgentContext, buildAgentPrompt } from '@/lib/voice/build-agent-prompt'
import {
  REALTIME_USER_FIELDS,
  REALTIME_USER_FIELD_LABELS,
  REALTIME_USER_FIELD_TYPES,
} from '@/lib/voice/realtime-user-fields-config'
import { useVoiceConversation } from '@/lib/voice/use-voice-conversation'
import { Maximize2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FC, useMemo, useState } from 'react'

interface ConversationInterfaceProps {
  agentName: string
  agentContext: AgentContext
  edenAgentId: string
  isDevMode?: boolean
}

const ConversationInterface: FC<ConversationInterfaceProps> = ({
  agentName,
  agentContext,
  edenAgentId,
  isDevMode = true,
}) => {
  const router = useRouter()

  // Initialize userInfo state based on config fields
  const initialUserInfo = useMemo(() => {
    return REALTIME_USER_FIELDS.reduce((acc, field) => {
      acc[field] = ''
      return acc
    }, {} as Record<string, string>)
  }, [])

  const [userInfo, setUserInfo] =
    useState<Record<string, string>>(initialUserInfo)

  // Helper to update a specific field
  const updateUserInfoField = (field: string, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }))
  }

  // Build the agent prompt from context
  const agentPrompt = buildAgentPrompt(agentContext, { name: agentName })

  // Initialize voice conversation with ElevenLabs provider
  // User info is passed to enable conversation overrides at start time
  const conversation = useVoiceConversation({
    provider: 'elevenlabs',
    agentPrompt,
    agentName,
    edenAgentId,
    userInfo,
  })

  // Toggle fullscreen by removing dev=true from URL
  const handleToggleFullscreen = () => {
    const currentPath = window.location.pathname
    router.push(currentPath)
  }

  // Determine if user info collection is needed
  const hasUserFields = REALTIME_USER_FIELDS.length > 0

  // Check if all required fields are filled (production mode only)
  const isUserInfoComplete =
    !hasUserFields ||
    REALTIME_USER_FIELDS.every(field => userInfo[field]?.trim() !== '')

  // In dev mode, always allow starting. In production, require complete info
  const canStartConversation = isDevMode || isUserInfoComplete

  // Handle stopping conversation and resetting form
  const handleStopConversation = async () => {
    await conversation.endConversation()
    // Reset user info fields for next session
    setUserInfo(initialUserInfo)
  }

  // Minimal UI for production mode
  if (!isDevMode) {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              conversation.status === 'connected'
                ? 'bg-green-500'
                : conversation.status === 'connecting'
                ? 'bg-yellow-500 animate-pulse'
                : 'bg-gray-500'
            }`}
          />
          <span className="text-sm font-medium text-muted-foreground">
            {conversation.status}
          </span>
        </div>

        {/* User Info Form or Action Button */}
        {conversation.status !== 'connected' ? (
          <>
            {/* Dynamic User Info Form - only show if fields configured */}
            {hasUserFields && (
              <div className="flex flex-col gap-4 w-full">
                <div className="text-center mb-2">
                  <h3 className="text-lg font-semibold mb-1">
                    Before we start
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Please provide your information to continue
                  </p>
                </div>

                {/* Dynamically generate input fields from config */}
                {REALTIME_USER_FIELDS.map(field => {
                  const label =
                    REALTIME_USER_FIELD_LABELS[field] ||
                    field.charAt(0).toUpperCase() + field.slice(1)
                  const inputType = REALTIME_USER_FIELD_TYPES[field] || 'text'

                  return (
                    <div key={field} className="flex flex-col gap-2">
                      <Label htmlFor={`user-${field}`}>{label}</Label>
                      <Input
                        id={`user-${field}`}
                        type={inputType}
                        placeholder={label}
                        value={userInfo[field] || ''}
                        onChange={e =>
                          updateUserInfoField(field, e.target.value)
                        }
                        disabled={conversation.status === 'connecting'}
                      />
                    </div>
                  )
                })}
              </div>
            )}

            {/* Start Button */}
            <Button
              onClick={conversation.startConversation}
              className="bg-primary hover:bg-primary/90 w-full"
              size="lg"
              disabled={
                conversation.status === 'connecting' || !canStartConversation
              }
            >
              {conversation.status === 'connecting'
                ? 'Connecting...'
                : 'Start Conversation'}
            </Button>
          </>
        ) : (
          <Button
            onClick={handleStopConversation}
            variant="destructive"
            size="lg"
            className="w-full"
          >
            Stop Conversation
          </Button>
        )}
      </div>
    )
  }

  // Full dev mode UI
  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Main Control Panel */}
      <div className="border border-border rounded-lg p-6 bg-card">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <StatusIndicator
              status={conversation.status}
              isSpeaking={conversation.isSpeaking}
            />

            {/* Fullscreen Button */}
            <Button
              onClick={handleToggleFullscreen}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              Fullscreen
            </Button>
          </div>

          {/* Optional User Info Form (Dev Mode) - only show if fields configured */}
          {conversation.status !== 'connected' && hasUserFields && (
            <div className="flex flex-col gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">
                Optional: Add user context for personalized conversation
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Dynamically generate input fields from config */}
                {REALTIME_USER_FIELDS.map(field => {
                  const label =
                    REALTIME_USER_FIELD_LABELS[field] ||
                    field.charAt(0).toUpperCase() + field.slice(1)
                  const inputType = REALTIME_USER_FIELD_TYPES[field] || 'text'

                  return (
                    <div key={field} className="flex flex-col gap-2">
                      <Label htmlFor={`user-${field}-dev`}>{label}</Label>
                      <Input
                        id={`user-${field}-dev`}
                        type={inputType}
                        placeholder={`${label} (optional)`}
                        value={userInfo[field] || ''}
                        onChange={e =>
                          updateUserInfoField(field, e.target.value)
                        }
                        disabled={conversation.status === 'connecting'}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {conversation.status !== 'connected' ? (
              <Button
                onClick={conversation.startConversation}
                className="bg-primary hover:bg-primary/90"
                size="lg"
                disabled={conversation.status === 'connecting'}
              >
                {conversation.status === 'connecting'
                  ? 'Connecting...'
                  : 'Start Conversation'}
              </Button>
            ) : (
              <Button
                onClick={handleStopConversation}
                variant="destructive"
                size="lg"
              >
                Stop Conversation
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Dev Panel */}
      <DevPanel
        conversation={conversation}
        agentContext={agentContext}
        agentPrompt={agentPrompt}
      />
    </div>
  )
}

export default ConversationInterface
