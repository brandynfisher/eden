'use client'

import React, { useCallback, useRef, useState } from 'react'
import { useLiveAudio, LiveAudioSettings } from './live-audio-context'
import { LiveAudioModal } from './live-audio-modal'
import { LiveRecordingIndicator } from './live-recording-indicator'

type LiveAudioManagerProps = {
  sessionId: string
  onStreamingMessage?: (content: string, attachments?: string[], options?: { skipSessionCreation?: boolean }) => void
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

  console.log('🎤 [LIVE-AUDIO-MANAGER] Rendered with sessionId:', sessionId, 'isRecording:', state.isRecording)

  const handleStartRecording = useCallback(async (settings: LiveAudioSettings) => {
    console.log('🎤 [LIVE-AUDIO-MANAGER] handleStartRecording called with settings:', settings)
    console.log('🎤 [LIVE-AUDIO-MANAGER] Current sessionId:', sessionId)
    
    if (!onStreamingMessage) {
      console.error('🎤 [LIVE-AUDIO-MANAGER] No onStreamingMessage callback provided')
      return
    }

    // Send initial system message to create/update session
    const systemMessage = `You are about to partake in a live conversation. Carefully read the conversation transcripts and act accordingly.

Your instructions are:
${settings.liveInstructions}

Await the next conversation transcription segment before acting.`
    
    console.log('🎤 [LIVE-AUDIO-MANAGER] Sending system message:', systemMessage)
    onStreamingMessage(systemMessage)
    
    // If this is a new session, store settings to start after session creation
    if (!sessionId || sessionId === 'new') {
      console.log('🎤 [LIVE-AUDIO-MANAGER] New session - storing pending settings')
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
      return
    }

    // Start recording immediately for existing sessions
    await startLiveAudioWithSession(settings)
  }, [sessionId, onStreamingMessage, startLiveAudio])

  const startLiveAudioWithSession = useCallback(async (settings: LiveAudioSettings) => {
    console.log('🎤 [LIVE-AUDIO-MANAGER] Starting live audio with session')
    
    if (!onStreamingMessage) {
      console.error('🎤 [LIVE-AUDIO-MANAGER] No onStreamingMessage callback for transcription')
      return
    }

    const success = await startLiveAudio(settings, (transcription: string, timestamp: string) => {
      console.log('🎤 [LIVE-AUDIO-MANAGER] Transcription received:', { transcription, timestamp })
      
      if (transcription.trim()) {
        const transcriptionMessage = `Live conversation segment transcription ${timestamp}: ${transcription}

React to the ongoing conversation based on your instructions`
        onStreamingMessage(transcriptionMessage, undefined, { skipSessionCreation: true })
      }
    })

    if (!success) {
      console.error('🎤 [LIVE-AUDIO-MANAGER] Failed to start live audio')
      // Clear pending settings on failure
      setPendingSettings(null)
      pendingSettingsRef.current = null
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pendingLiveAudioSettings')
      }
    }
  }, [startLiveAudio, onStreamingMessage])

  // Effect to start recording when session is created
  // This runs when sessionId changes from 'new' to an actual ID
  const handleSessionCreated = useCallback(() => {
    console.log('🎤 [LIVE-AUDIO-MANAGER] Checking for pending settings on session creation')
    console.log('🎤 [LIVE-AUDIO-MANAGER] sessionId:', sessionId)
    console.log('🎤 [LIVE-AUDIO-MANAGER] pendingSettings:', pendingSettings)
    console.log('🎤 [LIVE-AUDIO-MANAGER] pendingSettingsRef:', pendingSettingsRef.current)
    
    let settingsToUse = pendingSettings || pendingSettingsRef.current
    
    // Fallback: check sessionStorage
    if (!settingsToUse && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('pendingLiveAudioSettings')
        if (stored) {
          settingsToUse = JSON.parse(stored)
          console.log('🎤 [LIVE-AUDIO-MANAGER] Found settings in sessionStorage:', settingsToUse)
        }
      } catch (error) {
        console.warn('🎤 [LIVE-AUDIO-MANAGER] Error reading from sessionStorage:', error)
      }
    }
    
    if (settingsToUse && sessionId && sessionId !== 'new' && !state.isRecording) {
      console.log('🎤 [LIVE-AUDIO-MANAGER] Session created, starting live audio with settings:', settingsToUse)
      startLiveAudioWithSession(settingsToUse)
      
      // Clear pending settings
      setPendingSettings(null)
      pendingSettingsRef.current = null
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pendingLiveAudioSettings')
      }
    }
  }, [sessionId, pendingSettings, state.isRecording, startLiveAudioWithSession])

  // Call handleSessionCreated when sessionId changes
  React.useEffect(() => {
    handleSessionCreated()
  }, [handleSessionCreated])

  const handleStopRecording = useCallback(() => {
    console.log('🎤 [LIVE-AUDIO-MANAGER] handleStopRecording called')
    
    stopLiveAudio()
    
    // Clear any pending settings
    setPendingSettings(null)
    pendingSettingsRef.current = null
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pendingLiveAudioSettings')
    }
    
    // Send final message
    if (onStreamingMessage && state.currentSettings) {
      console.log('🎤 [LIVE-AUDIO-MANAGER] Sending final system message')
      const finalMessage = `Live conversation mode was terminated by the user.

Please await further instructions.`
      onStreamingMessage(finalMessage)
    }
  }, [stopLiveAudio, onStreamingMessage, state.currentSettings])

  const handleToggleRecording = useCallback(() => {
    console.log('🎤 [LIVE-AUDIO-MANAGER] handleToggleRecording called, isRecording:', state.isRecording)
    
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
            ;(el as any).__toggleRecording = handleToggleRecording
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