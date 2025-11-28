'use client'

import { DevPanel } from './components/dev-panel'
import { StatusIndicator } from './components/status-indicator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthState } from '@/hooks/use-auth-state'
import {
  AgentContext,
  AgentData,
  buildDynamicVariables,
} from '@/lib/voice/build-dynamic-variables'
import {
  DEFAULT_REALTIME_SETTINGS,
  RealtimeSettings,
} from '@/lib/voice/realtime-defaults'
import { useVoiceConversation } from '@/lib/voice/use-voice-conversation'
import { Maximize2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FC, useEffect, useMemo, useState } from 'react'

interface ConversationInterfaceProps {
  agentName: string
  agentContext: AgentContext
  edenAgentId: string
  realtimeSettings: RealtimeSettings
  isDevMode?: boolean
  onSpeakingChange?: (isSpeaking: boolean) => void
  onStatusChange?: (status: string) => void
}

const ConversationInterface: FC<ConversationInterfaceProps> = ({
  agentName,
  agentContext,
  edenAgentId,
  realtimeSettings,
  isDevMode = true,
  onSpeakingChange,
  onStatusChange,
}) => {
  const router = useRouter()
  const { verifyAuth } = useAuthState()

  // Get user input fields from realtime settings (or empty array if not configured)
  const userInputFields = useMemo(
    () => realtimeSettings.user_input_fields || [],
    [realtimeSettings.user_input_fields],
  )

  // Initialize userInfo state based on config fields
  const initialUserInfo = useMemo(() => {
    return userInputFields.reduce((acc, field) => {
      acc[field] = ''
      return acc
    }, {} as Record<string, string>)
  }, [userInputFields])

  const [userInfo, setUserInfo] =
    useState<Record<string, string>>(initialUserInfo)

  // Local state to track if we're in the process of starting
  const [isStarting, setIsStarting] = useState(false)

  // Helper to update a specific field
  const updateUserInfoField = (field: string, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }))
  }

  // Build dynamic variables from agent context and user info
  // This constructs the complete system prompt and first message
  const dynamicVariables = useMemo(() => {
    const agentData: AgentData = { name: agentName }
    // Use first_message from realtime settings, fall back to default
    const baseFirstMessage =
      realtimeSettings.first_message ||
      DEFAULT_REALTIME_SETTINGS.first_message ||
      ''
    return buildDynamicVariables(
      agentContext,
      agentData,
      userInfo,
      baseFirstMessage,
    )
  }, [agentContext, agentName, userInfo, realtimeSettings.first_message])

  // Initialize voice conversation with ElevenLabs provider
  // Dynamic variables are passed instead of agentPrompt
  const conversation = useVoiceConversation({
    provider: 'elevenlabs',
    dynamicVariables,
    edenAgentId,
    userInfo,
    realtimeSettings,
  })

  // Toggle fullscreen by removing dev=true from URL
  const handleToggleFullscreen = () => {
    const currentPath = window.location.pathname
    router.push(currentPath)
  }

  // Determine if user info collection is needed
  const hasUserFields = userInputFields.length > 0

  // Check if all required fields are filled (production mode only)
  const isUserInfoComplete =
    !hasUserFields ||
    userInputFields.every(field => userInfo[field]?.trim() !== '')

  // In dev mode, always allow starting. In production, require complete info
  const canStartConversation = isDevMode || isUserInfoComplete

  // Wrapper to immediately update UI when starting
  const handleStartConversation = async () => {
    // Check if user is authenticated first
    const isAuthenticated = await verifyAuth()
    if (!isAuthenticated) {
      return
    }

    setIsStarting(true)
    await conversation.startConversation()
  }

  // Clear isStarting when status changes from disconnected
  useEffect(() => {
    if (conversation.status !== 'disconnected') {
      setIsStarting(false)
    }
  }, [conversation.status])

  // Notify parent component when speaking state changes
  useEffect(() => {
    if (onSpeakingChange) {
      onSpeakingChange(conversation.isSpeaking)
    }
  }, [conversation.isSpeaking, onSpeakingChange])

  // Notify parent component when connection status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(conversation.status)
    }
  }, [conversation.status, onStatusChange])

  // Reset user info when conversation disconnects (both user and agent-initiated)
  useEffect(() => {
    if (conversation.status === 'disconnected') {
      setUserInfo(initialUserInfo)
    }
  }, [conversation.status, initialUserInfo])

  // Handle stopping conversation and resetting form
  const handleStopConversation = async () => {
    await conversation.endConversation()
  }

  // Minimal UI for production mode
  if (!isDevMode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-between w-full px-4 mt-12 min-h-0">
        {/* Spacer to push content to center */}
        <div className="flex-1 min-h-0" />

        {/* Middle section - User Info Form only */}
        <div className="flex-shrink-0 w-full flex flex-col items-center gap-6">
          {/* User Info Form - only show when not connected */}
          {conversation.status !== 'connected' && hasUserFields && (
            <div className="flex flex-col gap-4 w-[85vw] sm:w-[70vw] md:w-[50vw] lg:w-[40vw] xl:w-[30vw]">
              {/* Dynamically generate input fields from config */}
              {userInputFields.map(field => {
                const isFilled = userInfo[field]?.trim() !== ''

                return (
                  <div key={field} className="flex flex-col gap-2">
                    <Label
                      htmlFor={`user-${field}`}
                      className={`text-[clamp(1rem,2.5vw,1.125rem)] ${
                        isFilled ? 'text-white' : 'text-orange-500'
                      }`}
                    >
                      {field}:
                    </Label>
                    <Input
                      id={`user-${field}`}
                      type="text"
                      placeholder={field}
                      value={userInfo[field] || ''}
                      onChange={e => updateUserInfoField(field, e.target.value)}
                      disabled={
                        isStarting || conversation.status === 'connecting'
                      }
                      required
                      className="text-[clamp(1rem,2.5vw,1.25rem)] h-[clamp(2.75rem,6vh,3.5rem)]"
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Spacer to push content to center */}
        <div className="flex-1 min-h-0" />

        {/* Bottom section - Volume, Button and Status */}
        <div className="flex-shrink-0 flex flex-col items-center gap-6 w-[85vw] sm:w-[70vw] md:w-[50vw] lg:w-[40vw] xl:w-[30vw] mb-8">
          {/* Start/Stop Button */}
          {conversation.status !== 'connected' ? (
            <Button
              onClick={handleStartConversation}
              className={`w-full h-[clamp(3.5rem,8vh,5rem)] text-[clamp(1.125rem,3vw,1.5rem)] ${
                isStarting ||
                conversation.status === 'connecting' ||
                !canStartConversation
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary hover:bg-primary/90'
              }`}
              size="lg"
              disabled={
                isStarting ||
                conversation.status === 'connecting' ||
                !canStartConversation
              }
            >
              {isStarting || conversation.status === 'connecting'
                ? 'Connecting...'
                : 'Start'}
            </Button>
          ) : (
            <Button
              onClick={handleStopConversation}
              variant="outline"
              size="lg"
              className="w-full h-[clamp(3.5rem,8vh,5rem)] text-[clamp(1.125rem,3vw,1.5rem)] border-muted-foreground/30 hover:bg-muted/50"
            >
              Stop gesprek
            </Button>
          )}

          {/* Status Indicator */}
          <div className="flex items-center gap-3">
            <div
              className={`w-[clamp(0.75rem,1.5vw,1rem)] h-[clamp(0.75rem,1.5vw,1rem)] rounded-full ${
                conversation.status === 'connected'
                  ? 'bg-green-500'
                  : isStarting || conversation.status === 'connecting'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-gray-500'
              }`}
            />
            <span className="text-[clamp(0.875rem,2vw,1rem)] font-medium text-muted-foreground">
              {isStarting || conversation.status === 'connecting'
                ? 'connecting'
                : conversation.status}
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
                {userInputFields.map(field => (
                  <div key={field} className="flex flex-col gap-2">
                    <Label htmlFor={`user-${field}-dev`}>{field}</Label>
                    <Input
                      id={`user-${field}-dev`}
                      type="text"
                      placeholder={`${field} (optional)`}
                      value={userInfo[field] || ''}
                      onChange={e => updateUserInfoField(field, e.target.value)}
                      disabled={
                        isStarting || conversation.status === 'connecting'
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {conversation.status !== 'connected' ? (
              <Button
                onClick={handleStartConversation}
                className="bg-primary hover:bg-primary/90"
                size="lg"
                disabled={isStarting || conversation.status === 'connecting'}
              >
                {isStarting || conversation.status === 'connecting'
                  ? 'Connecting...'
                  : 'Start'}
              </Button>
            ) : (
              <Button
                onClick={handleStopConversation}
                variant="outline"
                size="lg"
                className="border-muted-foreground/30 hover:bg-muted/50"
              >
                Stop gesprek
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Dev Panel */}
      <DevPanel
        conversation={conversation}
        agentContext={agentContext}
        dynamicVariables={dynamicVariables}
      />
    </div>
  )
}

export default ConversationInterface
