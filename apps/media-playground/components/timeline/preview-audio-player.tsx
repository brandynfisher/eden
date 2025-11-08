import { cn } from '@/lib/utils'
import React from 'react'

type AudioPlayerProps = {
  containerClassName?: string
} & React.DetailedHTMLProps<
  React.AudioHTMLAttributes<HTMLAudioElement>,
  HTMLAudioElement
>

const PreviewAudioPlayer: React.FC<AudioPlayerProps> = ({
  containerClassName,
  className,
  controls = true,
  preload = 'none',
  ...rest
}) => {
  return (
    <div
      className={cn(
        'flex items-center rounded-md border border-border/40 bg-background/70 px-2 py-1 backdrop-blur-sm min-w-[200px] max-w-sm',
        containerClassName,
      )}
      onClick={event => event.stopPropagation()}
    >
      <audio
        {...rest}
        controls={controls}
        preload={preload}
        className={cn('h-8 w-full', className)}
        controlsList="nodownload noplaybackrate"
      />
    </div>
  )
}

export default PreviewAudioPlayer
