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
      <div className="flex-1 flex flex-col items-center justify-between w-full px-4 mt-8 min-h-0">
        {/* Spacer to push content to center */}
        <div className="flex-1 min-h-0" />

        {/* Middle section - User Info Form and Volume */}
        <div className="flex-shrink-0 w-full flex flex-col items-center gap-6">
          {/* Microphone Volume Bar */}
          {conversation.status === 'connected' && (
            <div className="w-3/4 md:w-1/4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${conversation.inputVolume}%` }}
                />
              </div>
            </div>
          )}

          {/* User Info Form - only show when not connected */}
          {conversation.status !== 'connected' && hasUserFields && (
            <div className="flex flex-col gap-4 w-3/4 md:w-1/4">
              {/* Dynamically generate input fields from config */}
              {REALTIME_USER_FIELDS.map(field => {
                const label =
                  REALTIME_USER_FIELD_LABELS[field] ||
                  field.charAt(0).toUpperCase() + field.slice(1)
                const inputType = REALTIME_USER_FIELD_TYPES[field] || 'text'
                const isFilled = userInfo[field]?.trim() !== ''

                return (
                  <div key={field} className="flex flex-col gap-2">
                    <Label
                      htmlFor={`user-${field}`}
                      className={isFilled ? 'text-white' : 'text-orange-500'}
                    >
                      {label}:
                    </Label>
                    <Input
                      id={`user-${field}`}
                      type={inputType}
                      placeholder={label}
                      value={userInfo[field] || ''}
                      onChange={e => updateUserInfoField(field, e.target.value)}
                      disabled={conversation.status === 'connecting'}
                      required
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Spacer to push content to center */}
        <div className="flex-1 min-h-0" />

        {/* Bottom section - Button and Status */}
        <div className="flex-shrink-0 flex flex-col items-center gap-6 w-3/4 md:w-1/4 mb-4">
          {/* Start/Stop Button */}
          {conversation.status !== 'connected' ? (
            <Button
              onClick={conversation.startConversation}
              className={`w-full h-16 text-xl ${
                conversation.status === 'connecting' || !canStartConversation
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary hover:bg-primary/90'
              }`}
              size="lg"
              disabled={
                conversation.status === 'connecting' || !canStartConversation
              }
            >
              {conversation.status === 'connecting' ? 'Connecting...' : 'Start'}
            </Button>
          ) : (
            <Button
              onClick={handleStopConversation}
              variant="destructive"
              size="lg"
              className="w-full h-16 text-xl"
            >
              Stop
            </Button>
          )}

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
        </div>
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

          {/* Microphone Volume Bar */}
          {conversation.status === 'connected' && (
            <div className="w-full">
              <div className="text-xs text-muted-foreground mb-1">
                Microphone Input
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${conversation.inputVolume}%` }}
                />
              </div>
            </div>
          )}

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
                  : 'Start'}
              </Button>
            ) : (
              <Button
                onClick={handleStopConversation}
                variant="destructive"
                size="lg"
              >
                Stop
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
