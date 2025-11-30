'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import axios from 'axios'
import { Loader2, Pause, Play } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface VoiceOption {
  value: string
  label: string
  description?: string
  previewUrl?: string
}

interface VoiceSelectorProps {
  value?: string
  onChange: (value: string) => void
  className?: string
}

export function VoiceSelector({
  value,
  onChange,
  className,
}: VoiceSelectorProps) {
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [voicesLoading, setVoicesLoading] = useState(true)
  const [voicesError, setVoicesError] = useState<string | null>(null)
  const [totalVoiceCount, setTotalVoiceCount] = useState(0)

  // Filters
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>(
    'all',
  )
  const [matchLanguage, setMatchLanguage] = useState(false)

  // Audio preview state
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)

  // Fetch voices from ElevenLabs API with filters
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setVoicesLoading(true)
        setVoicesError(null)

        // Build query params for filters
        const params = new URLSearchParams()
        if (genderFilter !== 'all') {
          params.append('gender', genderFilter)
        }
        if (matchLanguage) {
          params.append('language', 'en')
        }

        const queryString = params.toString()
        const url = queryString
          ? `/api/realtime/voices?${queryString}`
          : '/api/realtime/voices'

        const response = await axios.get(url)
        if (response.data?.voices) {
          setVoices(response.data.voices)
          // Store total count (unfiltered) on first load only
          if (
            genderFilter === 'all' &&
            !matchLanguage &&
            response.data.totalCount
          ) {
            setTotalVoiceCount(response.data.totalCount)
          }
        }
      } catch (err) {
        console.error('Failed to fetch voices:', err)
        setVoicesError('Failed to load voices')
      } finally {
        setVoicesLoading(false)
      }
    }
    fetchVoices()
  }, [genderFilter, matchLanguage])

  const selectedVoice = useMemo(() => {
    return voices.find(voice => voice.value === value)
  }, [voices, value])

  const handlePlayPreview = useCallback(
    (voiceId: string, previewUrl: string, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // If this voice is already playing, stop it
      if (playingVoiceId === voiceId && audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
        setPlayingVoiceId(null)
        return
      }

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      // Create and play new audio
      const audio = new Audio(previewUrl)
      audioRef.current = audio
      setPlayingVoiceId(voiceId)

      audio.play().catch(err => {
        console.error('Failed to play audio:', err)
        setPlayingVoiceId(null)
      })

      audio.onended = () => {
        setPlayingVoiceId(null)
        audioRef.current = null
      }

      audio.onerror = () => {
        setPlayingVoiceId(null)
        audioRef.current = null
      }
    },
    [playingVoiceId],
  )

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Voice Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Gender:</Label>
          <Select
            value={genderFilter}
            onValueChange={(val: 'all' | 'male' | 'female') =>
              setGenderFilter(val)
            }
          >
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="match-language-voice"
            checked={matchLanguage}
            onCheckedChange={checked => setMatchLanguage(checked === true)}
          />
          <Label
            htmlFor="match-language-voice"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Match language (en)
          </Label>
        </div>

        {voicesLoading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <span className="text-xs text-muted-foreground">
            {genderFilter !== 'all' || matchLanguage
              ? `${voices.length} of ${totalVoiceCount} voices`
              : `${voices.length} voices`}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Play button for selected voice */}
        {selectedVoice?.previewUrl && (
          <button
            type="button"
            onClick={e =>
              handlePlayPreview(
                selectedVoice.value,
                selectedVoice.previewUrl!,
                e,
              )
            }
            className="flex items-center justify-center w-9 h-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors shrink-0"
            aria-label={
              playingVoiceId === selectedVoice.value
                ? 'Pause preview'
                : 'Play preview'
            }
          >
            {playingVoiceId === selectedVoice.value ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>
        )}

        <Select
          value={value || ''}
          onValueChange={val => {
            // Stop any playing audio when changing voice
            if (audioRef.current) {
              audioRef.current.pause()
              audioRef.current = null
              setPlayingVoiceId(null)
            }
            onChange(val)
          }}
          disabled={voicesLoading}
        >
          <SelectTrigger className="flex-1">
            <SelectValue
              placeholder={
                voicesLoading ? 'Loading voices...' : 'Select a voice'
              }
            />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {voicesError ? (
              <div className="px-2 py-1.5 text-sm text-destructive">
                {voicesError}
              </div>
            ) : (
              voices.map(voice => (
                <SelectItem
                  key={voice.value}
                  value={voice.value}
                  className="py-2"
                  textValue={voice.label}
                >
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="font-medium">{voice.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {voice.description
                        ? voice.description.length > 200
                          ? `${voice.description.slice(0, 200)}...`
                          : voice.description
                        : '\u00A0'}
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
