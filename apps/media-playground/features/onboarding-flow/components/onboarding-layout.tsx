'use client'

import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

interface OnboardingLayoutProps {
  currentStep: number
  totalSteps: number
  canContinue: boolean
  previousRoute?: string
  nextRoute?: string
  children: ReactNode
  onContinue?: () => void
  progressText?: string
  agentImage?: string
}

export function OnboardingLayout({
  currentStep,
  totalSteps,
  canContinue,
  previousRoute,
  nextRoute,
  children,
  onContinue,
  progressText,
  agentImage,
}: OnboardingLayoutProps) {
  const router = useRouter()

  const progress = (currentStep / totalSteps) * 100

  const handleContinue = () => {
    if (!canContinue) return
    if (onContinue) {
      onContinue()
    } else if (nextRoute) {
      router.push(nextRoute)
    }
  }

  const handleBack = () => {
    if (previousRoute) {
      router.push(previousRoute)
    }
  }

  return (
    <div className="h-full bg-black flex flex-col">
      {/* Progress Bar - Fixed to top */}
      <div className="w-full bg-gray-900 h-2 flex-shrink-0">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-purple-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Navigation Header - Fixed to top */}
      <div className="bg-black/90 border-b border-gray-800 px-4 md:px-6 py-4 flex-shrink-0 sticky top-0 z-20">
        {/* Desktop: Grid layout for true centering */}
        <div className="hidden md:grid md:grid-cols-3 gap-4 items-center w-full">
          {/* Left: Agent avatar + Back Button */}
          <div className="flex justify-start items-center gap-3">
            {agentImage && (
              <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border border-gray-700">
                <img
                  src={agentImage}
                  alt="Agent"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {previousRoute && currentStep > 1 && (
              <button
                onClick={handleBack}
                className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
            )}
          </div>

          {/* Center: Step Indicator */}
          <div className="flex justify-center">
            <h2 className="text-[15px] font-bold text-yellow-400/60 whitespace-nowrap">
              Step {currentStep}/{totalSteps}
            </h2>
          </div>

          {/* Right: Continue Button */}
          <div className="flex justify-end items-center gap-3">
            {progressText && (
              <span
                className={`text-xs font-medium ${
                  canContinue ? 'text-purple-400' : 'text-orange-400'
                }`}
              >
                {progressText}
              </span>
            )}
            {nextRoute && (
              <button
                onClick={handleContinue}
                disabled={!canContinue}
                className={`
                  px-6 py-2.5 rounded-lg text-sm font-semibold text-white
                  transition-all duration-300 whitespace-nowrap shadow-lg flex items-center gap-2
                  ${
                    canContinue
                      ? 'hover:scale-[1.02] hover:shadow-xl'
                      : 'cursor-not-allowed opacity-50'
                  }
                `}
                style={{
                  background: canContinue
                    ? 'linear-gradient(135deg, #e6a825, #7c8aff)'
                    : '#374151',
                }}
              >
                Continue
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile: Centered step info with Continue button */}
        <div className="md:hidden flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            {agentImage && (
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-gray-700">
                <img
                  src={agentImage}
                  alt="Agent"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {previousRoute && currentStep > 1 ? (
              <button
                onClick={handleBack}
                className="text-yellow-400 hover:text-yellow-300 transition-colors text-xs font-medium flex items-center gap-1 flex-shrink-0"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
            ) : !agentImage ? (
              <div className="w-7" />
            ) : null}
          </div>
          <div className="flex flex-col items-center flex-1">
            <h2 className="text-[11px] font-bold text-yellow-400/60 whitespace-nowrap">
              Step {currentStep}/{totalSteps}
            </h2>
            {progressText && (
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  canContinue ? 'text-purple-400' : 'text-orange-400'
                }`}
              >
                {progressText}
              </span>
            )}
          </div>
          {nextRoute ? (
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-semibold text-white
                transition-all duration-300 whitespace-nowrap flex items-center gap-1 flex-shrink-0
                ${canContinue ? '' : 'cursor-not-allowed opacity-50'}
              `}
              style={{
                background: canContinue
                  ? 'linear-gradient(135deg, #e6a825, #7c8aff)'
                  : '#374151',
              }}
            >
              Continue
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  )
}
