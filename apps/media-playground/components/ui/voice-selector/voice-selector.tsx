import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Voice } from 'elevenlabs/api'
import { Check, ChevronsUpDown, Play } from 'lucide-react'
import React, { useCallback, useState } from 'react'

interface VoiceSelectorProps {
  voices: Voice[]
  value?: string
  onChange: (value: string) => void
  className?: string
}

export function VoiceSelector({
  voices,
  value,
  onChange,
  className,
}: VoiceSelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedVoice = voices.find(voice => voice.voice_id === value)

  const handlePlayVoiceSample = useCallback((url: string) => {
    const audioElement = document.createElement('audio')
    audioElement.autoplay = true
    audioElement.controls = false
    audioElement.src = url
  }, [])

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedVoice ? selectedVoice.name : 'Select voice...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
          {voices.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Voices could not be loaded. Please try again later.
            </div>
          ) : (
            <Command>
              <CommandInput placeholder="Search voices..." />
              <CommandEmpty>No voice found.</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="max-h-80 overflow-y-auto">
                  {voices.map(voice => (
                    <CommandItem
                      key={voice.voice_id}
                      onSelect={() => {
                        onChange(voice.voice_id)
                        setOpen(false)
                      }}
                      className="group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Check
                          className={cn(
                            'h-4 w-4',
                            value === voice.voice_id
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{voice.name}</span>
                          <div className="text-xs text-muted-foreground">
                            {voice.labels?.accent}, {voice.labels?.age},{' '}
                            {voice.labels?.gender}
                            {voice.description ? `, ${voice.description}` : ''}
                            {voice.labels?.use_case
                              ? `, ${voice.labels.use_case}`
                              : ''}
                          </div>
                        </div>
                      </div>
                      {voice.preview_url && (
                        <Button
                          className="sm:opacity-0 group-hover:opacity-100"
                          variant="outline"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation()
                            e.preventDefault()
                            if (voice.preview_url) {
                              handlePlayVoiceSample(voice.preview_url)
                            }
                          }}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </Command>
          )}
        </PopoverContent>
      </Popover>

      {selectedVoice && (
        <Button
          variant="ghost"
          className="w-fit gap-2"
          type="button"
          disabled={!selectedVoice.preview_url}
          onClick={() => {
            if (selectedVoice.preview_url) {
              handlePlayVoiceSample(selectedVoice.preview_url)
            }
          }}
        >
          <Play className="h-3 w-3" />
          Test voice: <strong>{selectedVoice.name}</strong>
        </Button>
      )}
    </div>
  )
}
