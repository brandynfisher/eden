'use client'

import { LIVE_AUDIO_DEFAULTS } from './live-audio-constants'
import { LiveAudioSettings, useLiveAudio } from './live-audio-context'
import { LiveAudioModal } from './live-audio-modal'
import React, { useCallback, useRef, useState } from 'react'

type LiveAudioManagerProps = {
  sessionId: string
  onStreamingMessage?: (content: string, attachments?: string[]) => void
  onTranscriptionMessage?: (content: string) => void
  isSubmitting?: boolean
}

export const LiveAudioManager = ({
  sessionId,
  onStreamingMessage,
}: LiveAudioManagerProps) => {
  const { state, startLiveAudio, stopLiveAudio } = useLiveAudio()
  const [showModal, setShowModal] = useState(false)
  const [pendingSettings, setPendingSettings] =
    useState<LiveAudioSettings | null>(null)
  const pendingSettingsRef = useRef<LiveAudioSettings | null>(null)
  const collectedTranscriptionsRef = useRef<string[]>([])
  const currentSessionIdRef = useRef<string>(sessionId)
  const shouldStartRecordingOnSessionCreation = useRef<boolean>(false)

  const sendTranscriptionMessage = useCallback(
    (content: string, timestamp: string) => {
      if (!onStreamingMessage) {
        console.error(
          '🎤 [LIVE-AUDIO-MANAGER] No onStreamingMessage callback available',
        )
        return
      }

      // Only send transcriptions if we have a real session (not "new")
      if (
        !currentSessionIdRef.current ||
        currentSessionIdRef.current === 'new'
      ) {
        return
      }

      const transcriptionMessage = `Live conversation segment transcription ${new Date(
        timestamp,
      ).toLocaleTimeString()}: ${content}\n\nReact to the ongoing conversation based on your instructions`

      onStreamingMessage(transcriptionMessage)
    },
    [onStreamingMessage],
  )

  const startLiveAudioWithSession = useCallback(
    async (settings: LiveAudioSettings) => {
      // Clear any previous transcriptions
      collectedTranscriptionsRef.current = []

      const success = await startLiveAudio(
        settings,
        // On each transcription: send as streaming message (triggers agent response)
        (transcription: string, timestamp: string) => {
          if (transcription.trim() && transcription.length > 3) {
            // Send transcription as streaming message (triggers agent response)
            sendTranscriptionMessage(transcription, timestamp)
          } else {
            // Skip short/empty transcriptions
          }
        },
        // On action interval: not needed since each transcription triggers response
        () => {},
      )

      if (!success) {
        console.error('🎤 [LIVE-AUDIO-MANAGER] Failed to start live audio')
        // Clear pending settings on failure
        setPendingSettings(null)
        pendingSettingsRef.current = null
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pendingLiveAudioSettings')
        }
      }
    },
    [startLiveAudio, sendTranscriptionMessage],
  )

  // Update session ID ref and check for pending recording
  React.useEffect(() => {
    currentSessionIdRef.current = sessionId

    // Check if we should start recording (either from flag or sessionStorage)
    if (sessionId && sessionId !== 'new' && !state.isRecording) {
      let settingsToUse = pendingSettings || pendingSettingsRef.current

      // Check sessionStorage for pending settings
      if (!settingsToUse && typeof window !== 'undefined') {
        try {
          const stored = sessionStorage.getItem('pendingLiveAudioSettings')
          if (stored) {
            settingsToUse = JSON.parse(stored)
          }
        } catch (error) {
          console.warn(
            '🎤 [LIVE-AUDIO-MANAGER] Error reading sessionStorage:',
            error,
          )
        }
      }

      // Start recording if we have settings
      if (settingsToUse) {
        startLiveAudioWithSession(settingsToUse)

        // Clear all pending state
        shouldStartRecordingOnSessionCreation.current = false
        setPendingSettings(null)
        pendingSettingsRef.current = null
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pendingLiveAudioSettings')
        }
      }
    }
  }, [sessionId, pendingSettings, startLiveAudioWithSession, state.isRecording])

  // Stop recording when component unmounts (navigation, etc.)
  React.useEffect(() => {
    return () => {
      if (state.isRecording) {
        stopLiveAudio()

        // Clear any pending state
        shouldStartRecordingOnSessionCreation.current = false
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pendingLiveAudioSettings')
        }
      }
    }
  }, [state.isRecording, stopLiveAudio])

  const handleStartRecording = useCallback(
    async (settings: LiveAudioSettings) => {
      if (!onStreamingMessage) {
        console.error(
          '🎤 [LIVE-AUDIO-MANAGER] No onStreamingMessage callback provided',
        )
        return
      }

      // Send initial system message to create/update session
      const systemMessage = `You are about to partake in a live conversation. Carefully read the conversation transcripts and act accordingly.

Your instructions are:
${settings.liveInstructions}

Await the next conversation transcription segment before acting.`

      // If this is a new session, create the session first but DON'T start recording yet
      if (!sessionId || sessionId === 'new') {
        // Store settings to start recording after session creation
        shouldStartRecordingOnSessionCreation.current = true
        setPendingSettings(settings)
        pendingSettingsRef.current = settings

        // Store in sessionStorage as backup
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(
              'pendingLiveAudioSettings',
              JSON.stringify(settings),
            )
          } catch (error) {
            console.warn(
              '🎤 [LIVE-AUDIO-MANAGER] Failed to store in sessionStorage:',
              error,
            )
          }
        }

        // Create the session (this will trigger navigation to the real session page)
        onStreamingMessage(systemMessage)
        return
      }

      await startLiveAudioWithSession(settings)
    },
    [sessionId, onStreamingMessage, startLiveAudioWithSession],
  )

  const handleStopRecording = useCallback(() => {
    stopLiveAudio()

    // Clear any pending settings and flags
    shouldStartRecordingOnSessionCreation.current = false
    setPendingSettings(null)
    pendingSettingsRef.current = null
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pendingLiveAudioSettings')
    }

    // Send final message
    if (state.currentSettings && onStreamingMessage) {
      const finalMessage = `Live conversation mode was terminated by the user.

Please await further instructions.`
      onStreamingMessage(finalMessage)
    }
  }, [stopLiveAudio, state.currentSettings, onStreamingMessage])

  const handleToggleRecording = useCallback(() => {
    if (state.isRecording) {
      handleStopRecording()
    } else {
      setShowModal(true)
    }
  }, [state.isRecording, handleStopRecording])

  return (
    <>
      {/* Modal for live audio settings */}
      <LiveAudioModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onStart={handleStartRecording}
        initialData={LIVE_AUDIO_DEFAULTS}
      />

      {/* Expose toggle function for external use */}
      <div
        data-live-audio-manager
        style={{ display: 'none' }}
        ref={el => {
          if (el) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (el as any).__toggleRecording = handleToggleRecording
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(el as any).__isRecording = state.isRecording
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(el as any).__isProcessing = state.isProcessing
          }
        }}
      />
    </>
  )
}

// Export the toggle function for use in message input
export const useLiveAudioControls = () => {
  const { state } = useLiveAudio()

  return {
    isRecording: state.isRecording,
    isProcessing: state.isProcessing,
    isLiveAudioActive: state.isRecording || state.isProcessing,
  }
}
