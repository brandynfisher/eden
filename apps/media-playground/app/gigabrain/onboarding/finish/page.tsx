'use client'

import { useOnboardingStore } from '../chat/store'
import {
  createAgentFromOnboardingState,
  processOnboardingLLMCalls,
} from '../lib/process-onboarding'
import { useAuthState } from '@/hooks/use-auth-state'
import { env } from '@/lib/config'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const PROGRESS_STEPS = [
  { message: 'Analyzing conversation...', duration: 5000, progressEnd: 20 },
  { message: 'Constructing persona...', duration: 5000, progressEnd: 40 },
  { message: 'Setting up visual identity...', duration: 5000, progressEnd: 60 },
  { message: 'Building Memory system...', progressEnd: 80 }, // Waits for LLM completion
  { message: 'Finalizing your Gigabrain...', progressEnd: 100 }, // Waits for agent creation
  { message: 'Your Gigabrain is ready!', progressEnd: 100 },
]

export default function OnboardingFinishPage() {
  const router = useRouter()
  const { user } = useAuthState()
  const sessionId = useOnboardingStore(state => state.sessionId)
  const name = useOnboardingStore(state => state.name)
  const username = useOnboardingStore(state => state.username)

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [llmCallComplete, setLlmCallComplete] = useState(false)
  const [agentCreationComplete, setAgentCreationComplete] = useState(false)
  const hasProcessedOnboarding = useRef(false)

  const isComplete = currentStepIndex >= PROGRESS_STEPS.length - 1
  const isGigabrainReady = isComplete

  useEffect(() => {
    if (!sessionId) {
      router.push('/gigabrain/onboarding/chat')
      return
    }
  }, [sessionId, router])

  // Start async operations immediately when component mounts
  useEffect(() => {
    if (!sessionId || !user?.userId || hasProcessedOnboarding.current) {
      return
    }

    hasProcessedOnboarding.current = true

    const processOnboarding = async () => {
      try {
        // Step 1: LLM processing (5-25s)
        await processOnboardingLLMCalls(sessionId)
        setLlmCallComplete(true)

        // Step 2: Agent creation (starts immediately after LLM, ~5s)
        await createAgentFromOnboardingState()
        setAgentCreationComplete(true)
      } catch (error) {
        console.error('[OnboardingFinish] Error:', error)
      }
    }

    processOnboarding()
  }, [sessionId, user])

  // Progress animation: auto-advance through timed steps, then wait for async operations
  useEffect(() => {
    const currentStep = PROGRESS_STEPS[currentStepIndex]
    const startProgress =
      currentStepIndex > 0
        ? PROGRESS_STEPS[currentStepIndex - 1].progressEnd
        : 0
    const endProgress = currentStep.progressEnd

    // Step 3: Wait for LLM completion
    if (currentStepIndex === 3) {
      setProgress(endProgress) // Set to 80%
      if (llmCallComplete) {
        setCurrentStepIndex(4)
      }
      return
    }

    // Step 4: Wait for agent creation completion
    if (currentStepIndex === 4) {
      setProgress(endProgress) // Set to 100%
      if (agentCreationComplete) {
        setCurrentStepIndex(5)
      }
      return
    }

    // Step 5: Final step, stay here
    if (currentStepIndex >= 5) {
      setProgress(100)
      return
    }

    // Steps 0-2: Auto-advance with timed animation
    if (currentStep.duration) {
      setProgress(startProgress) // Immediately set to start progress
      const startTime = Date.now()
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const percentage = Math.min(elapsed / currentStep.duration, 1)
        const newProgress =
          startProgress + percentage * (endProgress - startProgress)
        setProgress(newProgress)

        if (elapsed >= currentStep.duration) {
          clearInterval(interval)
          setProgress(endProgress)
          setCurrentStepIndex(prev => prev + 1)
        }
      }, 16)

      return () => clearInterval(interval)
    }
  }, [currentStepIndex, llmCallComplete, agentCreationComplete])

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
    <div className="h-full bg-black flex flex-col">
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
          <div className="relative w-full">
            <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  isComplete
                    ? 'bg-gradient-to-r from-yellow-400 to-purple-400'
                    : 'bg-gradient-to-r from-yellow-400 to-purple-400'
                }`}
                style={{
                  width: `${progress}%`,
                  minWidth: progress > 0 ? '2px' : '0',
                }}
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
