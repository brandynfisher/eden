'use client'

import { useOnboardingStore } from '../chat/store'
import { processOnboardingLLMCalls } from '../lib/process-onboarding'
import { env } from '@/lib/config'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const PROGRESS_STEPS = [
  { message: 'Constructing persona...', duration: 1500 },
  { message: 'Integrating knowledge...', duration: 1500 },
  { message: 'Setting up visual identity...', duration: 1500 },
  { message: 'Initiating memory system...', duration: 1500 },
  { message: 'Your Gigabrain is ready!', duration: 0 },
]

export default function OnboardingFinishPage() {
  const router = useRouter()
  const sessionId = useOnboardingStore(state => state.sessionId)
  const name = useOnboardingStore(state => state.name)
  const username = useOnboardingStore(state => state.username)

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const hasProcessedOnboarding = useRef(false)

  // TODO: This will be tied to actual agent creation later
  const isGigabrainReady = isComplete

  useEffect(() => {
    if (!sessionId) {
      router.push('/gigabrain/onboarding/chat')
      return
    }
  }, [sessionId, router])

  // Trigger async LLM calls when component mounts
  useEffect(() => {
    if (!sessionId || hasProcessedOnboarding.current) return

    hasProcessedOnboarding.current = true

    const processOnboarding = async () => {
      try {
        console.log('[OnboardingFinish] Starting LLM processing...')
        await processOnboardingLLMCalls(sessionId)
        console.log('[OnboardingFinish] LLM processing completed successfully')
      } catch (error) {
        console.error('[OnboardingFinish] Error processing onboarding:', error)
      }
    }

    processOnboarding()
  }, [sessionId])

  useEffect(() => {
    if (currentStepIndex >= PROGRESS_STEPS.length - 1) {
      setIsComplete(true)
      setProgress(100)
      return
    }

    const currentStep = PROGRESS_STEPS[currentStepIndex]
    const stepProgress = 100 / (PROGRESS_STEPS.length - 1)
    const startProgress = currentStepIndex * stepProgress

    // Animate progress over the duration
    const startTime = Date.now()
    const animationInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const stepPercentage = Math.min(elapsed / currentStep.duration, 1)
      setProgress(startProgress + stepPercentage * stepProgress)

      if (elapsed >= currentStep.duration) {
        clearInterval(animationInterval)
        setCurrentStepIndex(prev => prev + 1)
      }
    }, 16) // ~60fps

    return () => clearInterval(animationInterval)
  }, [currentStepIndex])

  if (!sessionId) {
    return null
  }

  // Determine the chat URL based on environment
  const getChatUrl = () => {
    const isStaging = env.NEXT_PUBLIC_APP_ENV === 'staging'
    const baseUrl = isStaging
      ? 'https://staging.app.eden.art'
      : 'https://app.eden.art'
    return `${baseUrl}/chat/${username}`
  }

  const handleChatWithAgent = () => {
    const chatUrl = getChatUrl()
    window.open(chatUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top 30% - Progress Section */}
      <div
        className={`flex-[0.3] flex flex-col items-center justify-center px-6 py-12 transition-all duration-1000 ${
          isComplete
            ? 'bg-gradient-to-br from-yellow-400/20 via-purple-400/20 to-black'
            : 'bg-black'
        }`}
      >
        <div className="w-full max-w-2xl space-y-8">
          {/* Progress Bar */}
          <div className="relative">
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isComplete
                    ? 'bg-gradient-to-r from-yellow-400 to-purple-400'
                    : 'bg-gradient-to-r from-yellow-400/60 to-purple-400/60'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Progress percentage */}
            <div className="absolute -top-8 right-0 text-yellow-400/60 text-sm font-medium">
              {Math.round(progress)}%
            </div>
          </div>

          {/* Status Message */}
          <div className="text-center space-y-4">
            <h2
              className={`text-3xl md:text-4xl font-bold transition-all duration-500 ${
                isComplete
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-purple-400 scale-110'
                  : 'text-white'
              }`}
            >
              {PROGRESS_STEPS[currentStepIndex].message}
            </h2>

            {isComplete && (
              <div className="animate-fade-in space-y-6">
                <div className="inline-block">
                  <svg
                    className="w-16 h-16 text-yellow-400 animate-bounce-slow"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                {/* Chat Button */}
                {isGigabrainReady && (
                  <div className="mt-8">
                    <button
                      onClick={handleChatWithAgent}
                      className="inline-flex items-center justify-center rounded-lg px-8 py-4 text-lg font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #e6a825, #7c8aff)',
                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      Chat with {name}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Substep Indicator Dots */}
          <div className="flex justify-center gap-3">
            {PROGRESS_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-500 ${
                  index < currentStepIndex
                    ? 'w-8 bg-gradient-to-r from-yellow-400 to-purple-400'
                    : index === currentStepIndex
                    ? 'w-12 bg-yellow-400/60 animate-pulse'
                    : 'w-2 bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom 70% - Two Cards */}
      <div className="flex-[0.7] px-4 py-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* Card 1 - Chat */}
            <div className="bg-black/60 rounded-xl border border-yellow-400/20 backdrop-blur-sm p-4 flex flex-col">
              <h3 className="text-xl font-bold text-yellow-400 mb-4 text-center">
                Chat with your Gigabrain
              </h3>
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                <img
                  src="/agent_builder_assets/chat.webp"
                  alt="Chat interface"
                  className="w-full h-full object-contain rounded-lg border border-yellow-400/10"
                />
              </div>
            </div>

            {/* Card 2 - Integrations */}
            <div className="bg-black/60 rounded-xl border border-yellow-400/20 backdrop-blur-sm p-4 flex flex-col">
              <h3 className="text-xl font-bold text-yellow-400 mb-4 text-center">
                Deploy your Gigabrain to social clients
              </h3>
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                <img
                  src="/agent_builder_assets/integrations.webp"
                  alt="Social integrations"
                  className="w-full h-full object-contain rounded-lg border border-yellow-400/10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
