import { onboardingChatConfig } from '../config'
import { ReactNode } from 'react'

interface OnboardingChatLayoutProps {
  userMessageCount: number
  children: ReactNode
  headerAction?: ReactNode
}

export function OnboardingChatLayout({
  userMessageCount,
  children,
  headerAction,
}: OnboardingChatLayoutProps) {
  const progress = Math.min(
    (userMessageCount / onboardingChatConfig.min_n_turns) * 100,
    100,
  )

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Progress Bar - Fixed to top */}
      <div className="w-full bg-gray-900 h-2 flex-shrink-0">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-purple-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress Header - Fixed to top */}
      <div className="bg-black/90 border-b border-gray-800 px-4 md:px-6 py-4 flex-shrink-0">
        {/* Desktop: Grid layout for true centering */}
        <div className="hidden md:grid md:grid-cols-3 gap-4 items-center w-full">
          {/* Left: Step Title */}
          <div className="flex justify-start">
            <h2 className="text-[15px] font-bold text-yellow-400/60 whitespace-nowrap">
              Step 1: Create Persona
            </h2>
          </div>

          {/* Center: Action Button */}
          <div className="flex justify-center">{headerAction}</div>

          {/* Right: Message Counter */}
          <div className="flex justify-end">
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {userMessageCount}/{onboardingChatConfig.min_n_turns}
              </div>
              <div className="text-xs text-gray-400">messages</div>
            </div>
          </div>
        </div>

        {/* Mobile: Stacked layout */}
        <div className="md:hidden">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[12px] font-bold text-yellow-400/60 whitespace-nowrap">
              Step 1: Create Persona
            </h2>
            <div className="text-right">
              <div className="text-lg font-bold text-white">
                {userMessageCount}/{onboardingChatConfig.min_n_turns}
              </div>
              <div className="text-xs text-gray-400">messages</div>
            </div>
          </div>
          {headerAction && <div className="mt-3 w-full">{headerAction}</div>}
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  )
}
