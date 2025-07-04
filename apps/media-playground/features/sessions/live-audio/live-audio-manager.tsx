'use client'

import React, { useCallback, useRef, useState } from 'react'
import { useLiveAudio, LiveAudioSettings } from './live-audio-context'
import { LiveAudioModal } from './live-audio-modal'
import { LiveRecordingIndicator } from './live-recording-indicator'

type LiveAudioManagerProps = {
  sessionId: string
  onStreamingMessage?: (content: string, attachments?: string[]) => void
  onTranscriptionMessage?: (content: string) => void
  isSubmitting?: boolean
}

export const LiveAudioManager = ({ 
  sessionId, 
  onStreamingMessage, 
  isSubmitting: _isSubmitting
}: LiveAudioManagerProps) => {
  const { state, startLiveAudio, stopLiveAudio } = useLiveAudio()
  const [showModal, setShowModal] = useState(false)
  const [pendingSettings, setPendingSettings] = useState<LiveAudioSettings | null>(null)
  const pendingSettingsRef = useRef<LiveAudioSettings | null>(null)
  const collectedTranscriptionsRef = useRef<string[]>([])
  const currentSessionIdRef = useRef<string>(sessionId)

  // Update session ID ref whenever sessionId prop changes
  React.useEffect(() => {
    currentSessionIdRef.current = sessionId
  }, [sessionId])
  
  // Send transcription as streaming message (triggers agent response)
  const sendTranscriptionMessage = useCallback((content: string, timestamp: string) => {
    if (!onStreamingMessage) {
      console.error('🎤 [LIVE-AUDIO-MANAGER] No onStreamingMessage callback available')
      return
    }
    
    const transcriptionMessage = `Live conversation segment transcription ${new Date(timestamp).toLocaleTimeString()}: ${content}\n\nReact to the ongoing conversation based on your instructions`
    
    console.log('🎤 [LIVE-AUDIO-MANAGER] Sending transcription for session:', currentSessionIdRef.current)
    onStreamingMessage(transcriptionMessage)
  }, [onStreamingMessage])


  const handleStartRecording = useCallback(async (settings: LiveAudioSettings) => {
    console.log('🎤 [LIVE-AUDIO-MANAGER] Starting recording with sessionId:', sessionId)
    
    if (!onStreamingMessage) {
      console.error('🎤 [LIVE-AUDIO-MANAGER] No onStreamingMessage callback provided')
      return
    }

    // Send initial system message to create/update session
    const systemMessage = `You are about to partake in a live conversation. Carefully read the conversation transcripts and act accordingly.

Your instructions are:
${settings.liveInstructions}

Await the next conversation transcription segment before acting.`
    
    onStreamingMessage(systemMessage)
    
    // If this is a new session, still start recording but store settings for later
    if (!sessionId || sessionId === 'new') {
      setPendingSettings(settings)
      pendingSettingsRef.current = settings
      
      // Store in sessionStorage as backup
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('pendingLiveAudioSettings', JSON.stringify(settings))
        } catch (error) {
          console.warn('🎤 [LIVE-AUDIO-MANAGER] Failed to store in sessionStorage:', error)
        }
      }
      
      // Start live audio even for new sessions
      await startLiveAudioWithSession(settings)
      return
    }

    // Start recording immediately for existing sessions
    await startLiveAudioWithSession(settings)
  }, [sessionId, onStreamingMessage, startLiveAudio])

  const startLiveAudioWithSession = useCallback(async (settings: LiveAudioSettings) => {
    
    // Clear any previous transcriptions
    collectedTranscriptionsRef.current = []
    
    const success = await startLiveAudio(
      settings, 
      // On each transcription: send as streaming message (triggers agent response)
      (transcription: string, timestamp: string) => {
        console.log('🎤 [LIVE-AUDIO-MANAGER] Transcription received:', transcription.slice(0, 50) + '...')
        
        if (transcription.trim() && transcription.length > 3) {
          // Send transcription as streaming message (triggers agent response)
          sendTranscriptionMessage(transcription, timestamp)
        } else {
          // Skip short/empty transcriptions
        }
      },
      // On action interval: not needed since each transcription triggers response
      () => {
      }
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
  }, [startLiveAudio, sendTranscriptionMessage, onStreamingMessage])

  // Effect to start recording when session is created
  // This runs when sessionId changes from 'new' to an actual ID
  const handleSessionCreated = useCallback(() => {
    console.log('🎤 [LIVE-AUDIO-MANAGER] Checking for pending settings, sessionId:', sessionId)
    
    let settingsToUse = pendingSettings || pendingSettingsRef.current
    
    // Fallback: check sessionStorage
    if (!settingsToUse && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('pendingLiveAudioSettings')
        if (stored) {
          settingsToUse = JSON.parse(stored)
        }
      } catch (error) {
        console.warn('🎤 [LIVE-AUDIO-MANAGER] Error reading from sessionStorage:', error)
      }
    }
    
    if (settingsToUse && sessionId && sessionId !== 'new' && !state.isRecording) {
      console.log('🎤 [LIVE-AUDIO-MANAGER] Session created, starting live audio')
      startLiveAudioWithSession(settingsToUse)
      
      // Clear pending settings
      setPendingSettings(null)
      pendingSettingsRef.current = null
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pendingLiveAudioSettings')
      }
    }
  }, [sessionId, pendingSettings, state.isRecording, startLiveAudioWithSession])

  // Call handleSessionCreated when sessionId changes from 'new' to actual ID
  React.useEffect(() => {
    if (sessionId && sessionId !== 'new' && !state.isRecording) {
      handleSessionCreated()
    }
  }, [sessionId, state.isRecording]) // Removed handleSessionCreated from deps to prevent infinite loop

  const handleStopRecording = useCallback(() => {
    
    stopLiveAudio()
    
    // Clear any pending settings
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
      {/* Recording indicator - always show when recording */}
      {state.isRecording && (
        <div className="mb-2">
          <LiveRecordingIndicator
            isRecording={state.isRecording}
            isProcessing={state.isProcessing}
            onStop={handleStopRecording}
          />
        </div>
      )}

      {/* Modal for live audio settings */}
      <LiveAudioModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onStart={handleStartRecording}
        initialData={{
          liveInstructions: 'Tell me a joke based on the ongoing conversation.',
          actionInterval: 10,
        }}
      />

      {/* Expose toggle function for external use */}
      <div 
        data-live-audio-manager 
        style={{ display: 'none' }}
        ref={(el) => {
          if (el) {
            (el as any).__toggleRecording = handleToggleRecording
            ;(el as any).__isRecording = state.isRecording
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