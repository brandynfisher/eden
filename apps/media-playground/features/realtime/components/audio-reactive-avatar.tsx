'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FC, useEffect, useRef, useState } from 'react'

interface AudioReactiveAvatarProps {
  imageSrc?: string
  name: string
  className?: string
}

/**
 * Avatar that pulses in size based on audio output volume
 * - Tracks baseline RMS and pulls towards scale = 1.0
 * - Modulates size from baseline based on instantaneous volume
 * - Uses 40fps max to avoid resource exhaustion
 * - Size range: 0.9x to 1.1x
 */
const AudioReactiveAvatar: FC<AudioReactiveAvatarProps> = ({
  imageSrc,
  name,
  className = 'w-40 h-40',
}) => {
  const [scale, setScale] = useState(1.0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const lastFrameTimeRef = useRef(0)
  const baselineRMSRef = useRef(0)
  const currentRMSRef = useRef(0)

  useEffect(() => {
    let mounted = true
    const FPS_LIMIT = 40
    const FRAME_INTERVAL = 1000 / FPS_LIMIT

    const initAudioAnalysis = async () => {
      try {
        // Create audio context
        const AudioContextClass =
          window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext?: typeof AudioContext
            }
          ).webkitAudioContext

        if (!AudioContextClass) {
          throw new Error('AudioContext not supported')
        }

        const audioContext = new AudioContextClass()
        audioContextRef.current = audioContext

        // Create analyser with lower FFT size (we only care about total volume)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 128 // Lower FFT size for better performance
        analyser.smoothingTimeConstant = 0.3 // Less smoothing for more responsive pulsing
        analyserRef.current = analyser

        // Function to connect an audio element
        const connectAudioElement = (audioElement: HTMLAudioElement) => {
          if (!audioContextRef.current || !analyserRef.current) return

          try {
            // Create media element source
            const source =
              audioContextRef.current.createMediaElementSource(audioElement)

            // Connect: source -> analyser -> destination
            source.connect(analyserRef.current)
            analyserRef.current.connect(audioContextRef.current.destination)

            // Start the animation loop
            if (mounted) {
              startVolumeAnalysis()
            }
          } catch {
            // If already connected, try to start analysis anyway
            if (mounted && !lastFrameTimeRef.current) {
              startVolumeAnalysis()
            }
          }
        }

        // Watch for audio elements being added to the DOM
        const observer = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
              if (node instanceof HTMLAudioElement) {
                connectAudioElement(node)
              }
            })
          })
        })

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        })

        // Check for existing audio elements
        const existingAudioElements = document.querySelectorAll('audio')
        existingAudioElements.forEach(audio => {
          connectAudioElement(audio)
        })

        // Fallback: Start analysis even if no audio elements found yet
        setTimeout(() => {
          if (mounted && !lastFrameTimeRef.current) {
            startVolumeAnalysis()
          }
        }, 1000)

        return observer
      } catch {
        return null
      }
    }

    const startVolumeAnalysis = () => {
      if (!analyserRef.current) {
        return
      }

      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      let frameCount = 0
      const BASELINE_UPDATE_INTERVAL = 60 // Update baseline every 60 frames (~1.5 seconds at 40fps)

      const analyzeVolume = (timestamp: number) => {
        if (!mounted || !analyserRef.current) return

        // Limit to 40fps
        if (timestamp - lastFrameTimeRef.current < FRAME_INTERVAL) {
          requestAnimationFrame(analyzeVolume)
          return
        }
        lastFrameTimeRef.current = timestamp
        analyserRef.current.getByteTimeDomainData(dataArray)

        // Calculate RMS (root mean square) of the waveform
        let sumSquares = 0
        for (let i = 0; i < bufferLength; i++) {
          const normalized = (dataArray[i] - 128) / 128 // Normalize to -1 to 1
          sumSquares += normalized * normalized
        }
        const rms = Math.sqrt(sumSquares / bufferLength)

        // Store current RMS
        currentRMSRef.current = rms

        // Update baseline (slowly pull towards current average)
        frameCount += 1
        if (frameCount % BASELINE_UPDATE_INTERVAL === 0) {
          // Pull baseline towards current RMS
          const pullFactor = 0.1
          baselineRMSRef.current =
            baselineRMSRef.current * (1 - pullFactor) + rms * pullFactor

          // Ensure baseline doesn't go to zero
          if (baselineRMSRef.current < 0.001) {
            baselineRMSRef.current = 0.02
          }
        }

        // Calculate deviation from baseline
        const baseline = Math.max(baselineRMSRef.current, 0.02)
        const deviation = (rms - baseline) / baseline

        // Map deviation to scale range (0.9 to 1.1)
        const minScale = 0.9
        const maxScale = 1.1
        const sensitivity = 3.0 // Increased sensitivity

        let newScale = 1.0 + deviation * sensitivity
        newScale = Math.max(minScale, Math.min(maxScale, newScale))

        setScale(newScale)

        // Continue animation loop
        requestAnimationFrame(analyzeVolume)
      }

      requestAnimationFrame(analyzeVolume)
    }

    let observer: MutationObserver | null = null
    initAudioAnalysis().then(obs => {
      observer = obs || null
    })

    // Cleanup
    return () => {
      mounted = false
      if (observer) {
        observer.disconnect()
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== 'closed'
      ) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return (
    <Avatar
      className={`${className} ring-4 ring-primary/25 transition-transform duration-75 ease-out`}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
    >
      <AvatarImage className="object-cover" src={imageSrc} alt={name} />
      <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-primary/15 to-primary/8 text-primary">
        {name?.charAt(0)?.toUpperCase() || 'A'}
      </AvatarFallback>
    </Avatar>
  )
}

export default AudioReactiveAvatar
