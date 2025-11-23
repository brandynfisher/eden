'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FC } from 'react'

interface AudioReactiveAvatarProps {
  imageSrc?: string
  name: string
  className?: string
  isSpeaking?: boolean
}

/**
 * Avatar that shows a visual indication when the agent is speaking
 * - Glows with a subtle pulse animation when speaking
 * - Returns to normal state when not speaking
 */
const AudioReactiveAvatar: FC<AudioReactiveAvatarProps> = ({
  imageSrc,
  name,
  className = 'w-40 h-40',
  isSpeaking = false,
}) => {
  return (
    <div className="relative">
      {/* Outer glow effect - only visible when speaking */}
      {isSpeaking && (
        <div className="absolute inset-0 rounded-full animate-pulse">
          <div className="absolute inset-0 rounded-full bg-primary/40 blur-2xl" />
          <div className="absolute inset-0 rounded-full bg-primary/25 blur-3xl animate-ping" />
        </div>
      )}

      {/* Avatar with enhanced ring when speaking */}
      <Avatar
        className={`${className} relative z-10 transition-all duration-300 ${
          isSpeaking
            ? 'ring-4 ring-primary/75 shadow-2xl shadow-primary/40'
            : 'ring-4 ring-primary/25'
        }`}
      >
        <AvatarImage className="object-cover" src={imageSrc} alt={name} />
        <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-primary/15 to-primary/8 text-primary">
          {name?.charAt(0)?.toUpperCase() || 'A'}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}

export default AudioReactiveAvatar
