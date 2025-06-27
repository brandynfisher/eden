'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { AuthClickGuard } from '@/features/chat/components/auth-click-guard'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { ThreadPrimitive } from '@assistant-ui/react'
import { ThreadWelcome, useThreadConfig } from '@assistant-ui/react-ui'
import { RotateCcwIcon } from 'lucide-react'
import React, { FC, ReactNode, useMemo } from 'react'

const MyThreadWelcomeAvatar: FC = () => {
  const { assistantAvatar: avatar = { fallback: 'A' } } = useThreadConfig()

  return (
    <div className="relative flex flex-col items-center">
      {/* Subtle glow effect behind avatar */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl scale-150 opacity-60 animate-pulse"></div>

      {/* Agent name with elegant typography */}
      <div className="text-lg md:text-xl font-semibold text-foreground mb-4 md:mb-6 tracking-wide">
        {avatar.fallback}
      </div>

      {/* Large, prominent avatar with beautiful border */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/25 to-primary/10 rounded-full scale-105 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"></div>
        <Avatar className="w-24 h-24 md:w-32 md:h-32 relative z-10 ring-4 ring-primary/25 ring-offset-4 ring-offset-background transition-all duration-300 hover:ring-primary/50 hover:scale-105">
          <AvatarImage
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            src={getCloudfrontOriginalUrl(avatar.src)}
          />
          <AvatarFallback
            delayMs={250}
            className="w-24 h-24 md:w-32 md:h-32 text-xl md:text-2xl font-bold bg-gradient-to-br from-primary/15 to-primary/8 text-primary border-2 border-primary/20"
          >
            {avatar.fallback}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}

const MyThreadWelcomeSuggestion: FC<{
  suggestion: { text: ReactNode; prompt: string }
}> = ({ suggestion: { text, prompt } }) => {
  return (
    <ThreadPrimitive.Suggestion prompt={prompt} method="replace" autoSend>
      <div className="px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 cursor-pointer">
        {text ?? prompt}
      </div>
    </ThreadPrimitive.Suggestion>
  )
}

const MyThreadWelcomeSuggestions: FC<{ onAgentSelectorOpen?: () => void }> = ({
  onAgentSelectorOpen,
}) => {
  const { welcome } = useThreadConfig()
  const suggestions = useMemo(
    () => welcome?.suggestions ?? [],
    [welcome?.suggestions],
  )

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap gap-3 justify-center">
        {suggestions.map((suggestion, index) => (
          <div
            className="suggestion-item hover:bg-gradient-to-r hover:from-primary/8 hover:to-primary/4 flex-shrink-0 border border-border rounded-full bg-gradient-to-br from-card to-muted/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
            key={`${suggestion.prompt}-${index}`}
          >
            <MyThreadWelcomeSuggestion
              suggestion={{ text: suggestion.text, prompt: suggestion.prompt }}
            />
          </div>
        ))}
      </div>

      {/* Agent Selector Button */}
      {onAgentSelectorOpen && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onAgentSelectorOpen}
            className="group relative bg-gradient-to-r from-card to-muted/60 border-border hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/8 hover:to-primary/4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/10"
          >
            <RotateCcwIcon className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-180" />
            Chat with another agent
          </Button>
        </div>
      )}
    </div>
  )
}

const MyThreadWelcome: FC<{
  children: ReactNode
  onAgentSelectorOpen?: () => void
}> = ({ children, onAgentSelectorOpen }) => {
  return (
    <ThreadWelcome.Root>
      <ThreadWelcome.Center className="relative">
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-150">
          <MyThreadWelcomeAvatar />
        </div>

        <div className="max-w-4xl animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300 mb-8">
          <ThreadWelcome.Message className="text-lg md:text-xl lg:text-2xl font-light leading-relaxed text-foreground/90 tracking-wide" />
        </div>
        {children}
        <AuthClickGuard className="mt-6">
          <MyThreadWelcomeSuggestions
            onAgentSelectorOpen={onAgentSelectorOpen}
          />
        </AuthClickGuard>
      </ThreadWelcome.Center>
    </ThreadWelcome.Root>
  )
}

export default MyThreadWelcome
