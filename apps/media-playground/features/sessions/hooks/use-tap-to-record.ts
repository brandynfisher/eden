'use client'

import { SAFE_MICROPHONE_CONSTRAINTS } from '@/lib/voice/audio-config'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

type TapToRecordState = {
  isRecording: boolean
  isTranscribing: boolean
}

type UseTapToRecordOptions = {
  onTranscription: (text: string) => void
  onTranscribingChange?: (isTranscribing: boolean) => void
  onError?: (error: string) => void
}

export const useTapToRecord = ({
  onTranscription,
  onTranscribingChange,
  onError,
}: UseTapToRecordOptions) => {
  const [state, setState] = useState<TapToRecordState>({
    isRecording: false,
    isTranscribing: false,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)
  const isCancelledRef = useRef<boolean>(false)

  const requestMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: SAFE_MICROPHONE_CONSTRAINTS,
        video: false,
      })
      mediaStreamRef.current = stream
      return true
    } catch (error) {
      console.error('[TAP-TO-RECORD] Error accessing microphone:', error)

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

      toast.error('Recording Error', {
        description: errorMessage,
        duration: 5000,
      })

      onError?.(errorMessage)
      return false
    }
  }, [onError])

  const setTranscribing = useCallback(
    (isTranscribing: boolean) => {
      setState(prev => ({ ...prev, isTranscribing }))
      onTranscribingChange?.(isTranscribing)
    },
    [onTranscribingChange],
  )

  const transcribeAudio = useCallback(
    async (audioBlob: Blob) => {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController()

      try {
        setTranscribing(true)

        // Skip if blob is too small (likely silence)
        if (audioBlob.size < 1000) {
          toast.info('Recording too short', {
            description: 'Please record a longer message.',
            duration: 3000,
          })
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
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('[TAP-TO-RECORD] Transcription API error:', errorText)

          if (response.status === 429) {
            toast.error('Rate limit exceeded', {
              description: 'Please try again in a moment.',
              duration: 3000,
            })
          } else {
            toast.error('Transcription failed', {
              description: 'Failed to transcribe audio. Please try again.',
              duration: 3000,
            })
          }
          onError?.('Transcription failed')
          return
        }

        const result = await response.json()

        if (result.success && result.transcription) {
          onTranscription(result.transcription)
        } else {
          console.error('[TAP-TO-RECORD] Transcription failed:', result)
          toast.error('Transcription failed', {
            description: 'No transcription returned. Please try again.',
            duration: 3000,
          })
        }
      } catch (error) {
        // Don't show error for aborted requests
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        console.error('[TAP-TO-RECORD] Error transcribing audio:', error)

        toast.error('Network Error', {
          description:
            'Failed to connect to transcription service. Please check your internet connection.',
          duration: 3000,
        })
        onError?.('Network error')
      } finally {
        setTranscribing(false)
        abortControllerRef.current = null
      }
    },
    [onTranscription, onError, setTranscribing],
  )

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const startRecording = useCallback(async () => {
    // Request microphone access
    const hasAccess = await requestMicrophoneAccess()
    if (!hasAccess || !mediaStreamRef.current) {
      return
    }

    try {
      chunksRef.current = []
      isCancelledRef.current = false

      const recorder = new MediaRecorder(mediaStreamRef.current, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000,
      })

      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        // Stop all media tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop())
          mediaStreamRef.current = null
        }

        setState(prev => ({ ...prev, isRecording: false }))

        // Only process audio if recording was not cancelled
        if (!isCancelledRef.current && chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, {
            type: 'audio/webm;codecs=opus',
          })
          transcribeAudio(audioBlob)
        }
        chunksRef.current = []
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setState(prev => ({ ...prev, isRecording: true }))
    } catch (error) {
      console.error('[TAP-TO-RECORD] Error starting recording:', error)

      // Clean up on error
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }

      toast.error('Recording Error', {
        description:
          error instanceof Error
            ? error.message
            : 'Failed to start recording. Please try again.',
        duration: 3000,
      })
    }
  }, [requestMicrophoneAccess, transcribeAudio])

  const toggleRecording = useCallback(() => {
    if (state.isRecording) {
      stopRecording()
    } else if (!state.isTranscribing) {
      startRecording()
    }
  }, [state.isRecording, state.isTranscribing, startRecording, stopRecording])

  // Cancel recording or transcription
  const cancelRecording = useCallback(() => {
    // Set cancelled flag to prevent transcription in onstop handler
    isCancelledRef.current = true

    // Cancel ongoing transcription
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // Stop recording if active
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop()
    }

    // Stop all media tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    // Clear chunks
    chunksRef.current = []

    // Reset state
    setState({ isRecording: false, isTranscribing: false })
    onTranscribingChange?.(false)

    toast.info('Recording cancelled', {
      duration: 2000,
    })
  }, [onTranscribingChange])

  return {
    isRecording: state.isRecording,
    isTranscribing: state.isTranscribing,
    isActive: state.isRecording || state.isTranscribing,
    startRecording,
    stopRecording,
    toggleRecording,
    cancelRecording,
  }
}
