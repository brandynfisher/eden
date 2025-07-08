'use client'

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'

export type LiveAudioSettings = {
  liveInstructions: string
  actionInterval: number
}

type LiveAudioState = {
  isRecording: boolean
  isProcessing: boolean
  currentSettings: LiveAudioSettings | null
}

type LiveAudioContextType = {
  // State
  state: LiveAudioState

  // Actions
  startLiveAudio: (
    settings: LiveAudioSettings,
    onTranscription: (transcription: string, timestamp: string) => void,
    onActionInterval?: () => void,
  ) => Promise<boolean>
  stopLiveAudio: () => void

  // Utils
  isLiveAudioActive: boolean
}

const LiveAudioContext = createContext<LiveAudioContextType | null>(null)

export const useLiveAudio = () => {
  const context = useContext(LiveAudioContext)
  if (!context) {
    throw new Error('useLiveAudio must be used within a LiveAudioProvider')
  }
  return context
}

export const useLiveAudioAvailable = () => {
  const context = useContext(LiveAudioContext)
  return context !== null
}

type LiveAudioProviderProps = {
  children: ReactNode
}

export const LiveAudioProvider = ({ children }: LiveAudioProviderProps) => {
  const [state, setState] = useState<LiveAudioState>({
    isRecording: false,
    isProcessing: false,
    currentSettings: null,
  })

  // Force reset recording state on mount to prevent stuck states
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isRecording: false,
      isProcessing: false,
    }))
    isRecordingRef.current = false
  }, [])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isRecordingRef = useRef<boolean>(false)
  const onTranscriptionRef = useRef<
    ((transcription: string, timestamp: string) => void) | null
  >(null)
  const onActionIntervalRef = useRef<(() => void) | null>(null)

  const requestMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      mediaStreamRef.current = stream
      return true
    } catch (error) {
      console.error('🎤 [LIVE-AUDIO] Error accessing microphone:', error)

      let errorMessage = 'Microphone access denied'
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage =
            'Microphone access denied. Please allow microphone access in your browser settings.'
        } else if (error.name === 'NotFoundError') {
          errorMessage =
            'No microphone found. Please connect a microphone and try again.'
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microphone is already in use by another application.'
        } else {
          errorMessage = `Microphone error: ${error.message}`
        }
      }

      toast.error('Live Audio Error', {
        description: errorMessage,
        duration: 5000,
      })

      return false
    }
  }, [])

  const processAudioChunk = useCallback(async (audioBlob: Blob) => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }))

      // Skip if blob is too small (likely silence)
      if (audioBlob.size < 1000) {
        setState(prev => ({ ...prev, isProcessing: false }))
        return
      }

      const formData = new FormData()
      const audioFile = new File([audioBlob], 'audio.webm', {
        type: audioBlob.type || 'audio/webm',
      })
      formData.append('audio', audioFile)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('🎤 [LIVE-AUDIO] Transcription API error:', errorText)

        // Only show error toast for non-temporary errors
        if (response.status !== 429 && response.status !== 503) {
          toast.error('Transcription Error', {
            description: `Failed to transcribe audio: ${response.statusText}`,
            duration: 3000,
          })
        }
        return
      }

      const result = await response.json()

      if (result.success && result.transcription) {
        console.log(
          '🎤 [LIVE-AUDIO] Transcription:',
          result.transcription.slice(0, 50) + '...',
        )
        onTranscriptionRef.current?.(result.transcription, result.timestamp)
      } else {
        console.error('🎤 [LIVE-AUDIO] Transcription failed:', result)
      }
    } catch (error) {
      console.error('🎤 [LIVE-AUDIO] Error processing audio chunk:', error)

      // Only show error toast for network errors, not for every small issue
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network Error', {
          description:
            'Failed to connect to transcription service. Please check your internet connection.',
          duration: 3000,
        })
      }
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }))
    }
  }, [])

  const createMediaRecorder = useCallback(
    (onDataAvailable: (event: BlobEvent) => void, onStop: () => void) => {
      if (!mediaStreamRef.current) return null

      const recorder = new MediaRecorder(mediaStreamRef.current, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000,
      })

      recorder.ondataavailable = onDataAvailable
      recorder.onstop = onStop

      return recorder
    },
    [],
  )

  const startLiveAudio = useCallback(
    async (
      settings: LiveAudioSettings,
      onTranscription: (transcription: string, timestamp: string) => void,
      onActionInterval?: () => void,
    ): Promise<boolean> => {
      // Request microphone access
      const hasAccess = await requestMicrophoneAccess()
      if (!hasAccess) {
        return false
      }

      if (!mediaStreamRef.current) {
        toast.error('Live Audio Error', {
          description: 'Failed to access microphone stream. Please try again.',
          duration: 3000,
        })
        return false
      }

      try {
        onTranscriptionRef.current = onTranscription
        onActionIntervalRef.current = onActionInterval || null
        chunksRef.current = []

        const recorder = createMediaRecorder(
          event => {
            if (event.data.size > 0) {
              chunksRef.current.push(event.data)
            }
          },
          () => {
            if (chunksRef.current.length > 0) {
              const audioBlob = new Blob(chunksRef.current, {
                type: 'audio/webm;codecs=opus',
              })
              processAudioChunk(audioBlob)
              chunksRef.current = []
            }
          },
        )

        if (!recorder) {
          toast.error('Live Audio Error', {
            description:
              'Failed to create audio recorder. Your browser may not support this feature.',
            duration: 3000,
          })
          return false
        }

        mediaRecorderRef.current = recorder

        // Start initial recording
        recorder.start()
        setState(prev => ({
          ...prev,
          isRecording: true,
          currentSettings: settings,
        }))
        isRecordingRef.current = true

        console.log('🎤 [LIVE-AUDIO] Recording started')

        // Set up interval for processing chunks
        intervalRef.current = setInterval(() => {
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === 'recording' &&
            isRecordingRef.current
          ) {
            // Stop current recording to process chunk
            mediaRecorderRef.current.stop()

            // Trigger action interval callback after a short delay to allow transcription to complete
            setTimeout(() => {
              if (onActionIntervalRef.current) {
                onActionIntervalRef.current()
              }
            }, 500)

            // Start new recording session after a short delay
            setTimeout(() => {
              if (mediaStreamRef.current && isRecordingRef.current) {
                const newRecorder = createMediaRecorder(
                  event => {
                    if (event.data.size > 0) {
                      chunksRef.current.push(event.data)
                    }
                  },
                  () => {
                    if (chunksRef.current.length > 0) {
                      const audioBlob = new Blob(chunksRef.current, {
                        type: 'audio/webm;codecs=opus',
                      })
                      processAudioChunk(audioBlob)
                      chunksRef.current = []
                    }
                  },
                )

                if (newRecorder) {
                  mediaRecorderRef.current = newRecorder
                  newRecorder.start()
                }
              }
            }, 100)
          }
        }, settings.actionInterval * 1000)

        return true
      } catch (error) {
        console.error('🎤 [LIVE-AUDIO] Error starting recording:', error)

        // Clean up on error
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop())
          mediaStreamRef.current = null
        }

        setState(prev => ({
          ...prev,
          isRecording: false,
          isProcessing: false,
          currentSettings: null,
        }))

        toast.error('Live Audio Error', {
          description:
            error instanceof Error
              ? error.message
              : 'Failed to start live audio recording',
          duration: 3000,
        })

        return false
      }
    },
    [requestMicrophoneAccess, processAudioChunk, createMediaRecorder],
  )

  const stopLiveAudio = useCallback(() => {
    isRecordingRef.current = false

    // Clear interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Create cleanup function that ensures proper microphone release
    const cleanupMicrophoneResources = () => {
      // Stop all tracks in the current stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop()
          }
        })
        mediaStreamRef.current = null
      }

      // Additional cleanup: Query all active media streams to ensure cleanup
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        // Force cleanup of any remaining active tracks
        try {
          navigator.mediaDevices.getUserMedia({ audio: false }).catch(() => {
            // This intentionally fails to help trigger cleanup of existing streams
          })
        } catch {
          // Ignore errors - this is just for cleanup
        }
      }

      // Update state
      setState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        currentSettings: null,
      }))
      
      // Clear refs
      mediaRecorderRef.current = null
      onTranscriptionRef.current = null
      onActionIntervalRef.current = null
    }

    // Stop recording with proper sequencing
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      // Set up one-time event listener to ensure proper cleanup after recorder stops
      const handleRecorderStop = () => {
        mediaRecorderRef.current?.removeEventListener('stop', handleRecorderStop)
        // Add small delay to ensure recorder has fully processed
        setTimeout(cleanupMicrophoneResources, 100)
      }
      
      mediaRecorderRef.current.addEventListener('stop', handleRecorderStop)
      mediaRecorderRef.current.stop()
      
      // Fallback cleanup in case the stop event doesn't fire
      setTimeout(() => {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.removeEventListener('stop', handleRecorderStop)
          cleanupMicrophoneResources()
        }
      }, 1000)
    } else {
      // If no active recording, cleanup immediately
      cleanupMicrophoneResources()
    }
  }, [])

  // Cleanup on unmount to prevent stuck recording state
  useEffect(() => {
    return () => {
      // Stop everything
      isRecordingRef.current = false

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === 'recording'
      ) {
        mediaRecorderRef.current.stop()
      }

      // Enhanced cleanup for unmount
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop()
          }
        })
        mediaStreamRef.current = null
      }

      // Additional cleanup for unmount
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        try {
          navigator.mediaDevices.getUserMedia({ audio: false }).catch(() => {
            // This intentionally fails to help trigger cleanup of existing streams
          })
        } catch {
          // Ignore errors - this is just for cleanup
        }
      }

      mediaRecorderRef.current = null
      onTranscriptionRef.current = null
      onActionIntervalRef.current = null
    }
  }, [])

  const value: LiveAudioContextType = {
    state,
    startLiveAudio,
    stopLiveAudio,
    isLiveAudioActive: state.isRecording || state.isProcessing,
  }

  return (
    <LiveAudioContext.Provider value={value}>
      {children}
    </LiveAudioContext.Provider>
  )
}
