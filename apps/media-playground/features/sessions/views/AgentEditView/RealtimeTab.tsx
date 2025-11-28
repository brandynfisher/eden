'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  DEFAULT_REALTIME_SETTINGS,
  type RealtimeLLM,
} from '@/lib/voice/realtime-defaults'
import { Agent } from '@edenlabs/eden-sdk'
import axios from 'axios'
import {
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  X,
} from 'lucide-react'
import Link from 'next/link'
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'

// LLM options derived from RealtimeLLM type
const LLM_OPTIONS: { value: RealtimeLLM; label: string }[] = [
  { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
  { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
  { value: 'gpt-5-nano', label: 'GPT-5 Nano' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
]

// Max tokens options
const MAX_TOKENS_OPTIONS = [
  { value: 1024, label: '1024' },
  { value: 2048, label: '2048' },
  { value: 4096, label: '4096' },
]

// Common languages for voice conversations
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'nl', label: 'Dutch' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'pl', label: 'Polish' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ko', label: 'Korean' },
] as const

// Voice option type for dynamically loaded voices
interface VoiceOption {
  value: string
  label: string
  description?: string
  category?: string
  previewUrl?: string
}

// Special value for custom voice ID
const CUSTOM_VOICE_VALUE = '__custom__'

interface RealtimeSettings {
  agent: string
  voice_id: string | null
  language: string
  first_message: string | null
  llm_model: RealtimeLLM
  temperature: number
  max_tokens: number
  tts_stability: number
  tts_speed: number
  tts_similarity_boost: number
  user_input_fields: string[]
}

interface RealtimeTabProps {
  agent: Agent
}

export const RealtimeTab: FC<RealtimeTabProps> = ({ agent }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<RealtimeSettings>({
    ...DEFAULT_REALTIME_SETTINGS,
    agent: agent._id,
  } as RealtimeSettings)

  // Track the last saved settings to detect unsaved changes
  const [savedSettings, setSavedSettings] = useState<RealtimeSettings | null>(
    null,
  )

  // State for adding new user input field
  const [newFieldLabel, setNewFieldLabel] = useState('')

  // State for debug mode checkbox (default enabled)
  const [debugMode, setDebugMode] = useState(true)

  // State for custom voice ID mode
  const [isCustomVoice, setIsCustomVoice] = useState(false)
  const [customVoiceId, setCustomVoiceId] = useState('')

  // State for dynamically loaded voices from ElevenLabs
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [totalVoiceCount, setTotalVoiceCount] = useState<number>(0)
  const [voicesLoading, setVoicesLoading] = useState(true)
  const [voicesError, setVoicesError] = useState<string | null>(null)

  // Voice filter state
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>(
    'all',
  )
  const [matchLanguage, setMatchLanguage] = useState(false)

  // Audio preview state
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!savedSettings) return false
    return (
      settings.voice_id !== savedSettings.voice_id ||
      settings.language !== savedSettings.language ||
      settings.first_message !== savedSettings.first_message ||
      settings.llm_model !== savedSettings.llm_model ||
      settings.temperature !== savedSettings.temperature ||
      settings.max_tokens !== savedSettings.max_tokens ||
      settings.tts_stability !== savedSettings.tts_stability ||
      settings.tts_speed !== savedSettings.tts_speed ||
      settings.tts_similarity_boost !== savedSettings.tts_similarity_boost ||
      JSON.stringify(settings.user_input_fields) !==
        JSON.stringify(savedSettings.user_input_fields)
    )
  }, [settings, savedSettings])

  // Fetch available voices from ElevenLabs API with filters
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
        if (matchLanguage && settings.language) {
          params.append('language', settings.language)
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
  }, [genderFilter, matchLanguage, settings.language])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await axios.get(`/api/agents/${agent._id}/realtime`)
        if (response.data?.settings) {
          const loadedSettings = response.data.settings
          // Merge with defaults to ensure all fields exist
          const mergedSettings = {
            ...DEFAULT_REALTIME_SETTINGS,
            agent: agent._id,
            ...loadedSettings,
            // Ensure user_input_fields is always an array
            user_input_fields: loadedSettings.user_input_fields || [],
          } as RealtimeSettings
          setSettings(mergedSettings)
          // Track the saved state for detecting changes
          setSavedSettings(mergedSettings)
        } else {
          // No existing settings, use defaults and track them as saved
          const defaultSettings = {
            ...DEFAULT_REALTIME_SETTINGS,
            agent: agent._id,
            user_input_fields: [],
          } as RealtimeSettings
          setSettings(defaultSettings)
          setSavedSettings(defaultSettings)
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status
          const message = err.response?.data?.message || err.message
          setError(`Failed to load settings: ${message} (${status})`)
        } else {
          setError('Failed to load settings')
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [agent._id])

  // Check if loaded voice_id is a custom one (not in the fetched voice list)
  useEffect(() => {
    if (!voicesLoading && voices.length > 0 && settings.voice_id) {
      const isKnownVoice = voices.some(v => v.value === settings.voice_id)
      if (!isKnownVoice) {
        setIsCustomVoice(true)
        setCustomVoiceId(settings.voice_id)
      }
    }
  }, [voices, voicesLoading, settings.voice_id])

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      await axios.patch(`/api/agents/${agent._id}/realtime`, {
        voice_id: settings.voice_id || undefined,
        language: settings.language,
        first_message: settings.first_message || undefined,
        llm_model: settings.llm_model,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens,
        tts_stability: settings.tts_stability,
        tts_speed: settings.tts_speed,
        tts_similarity_boost: settings.tts_similarity_boost,
        user_input_fields: settings.user_input_fields,
      })
      // Update saved state to reflect the new saved values
      setSavedSettings({ ...settings })
      toast.success('Realtime settings saved', {
        description: 'Your changes have been saved.',
        richColors: true,
        dismissible: true,
      })
    } catch (err) {
      toast.error('Failed to save realtime settings', {
        description: 'Please try again later.',
        richColors: true,
        dismissible: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // User input field management
  const handleAddField = () => {
    const trimmedLabel = newFieldLabel.trim()
    if (!trimmedLabel) return
    if (settings.user_input_fields.includes(trimmedLabel)) {
      toast.error('Field already exists', {
        description: `A field with the label "${trimmedLabel}" already exists.`,
        richColors: true,
        dismissible: true,
      })
      return
    }
    setSettings(prev => ({
      ...prev,
      user_input_fields: [...prev.user_input_fields, trimmedLabel],
    }))
    setNewFieldLabel('')
  }

  const handleRemoveField = (fieldToRemove: string) => {
    setSettings(prev => ({
      ...prev,
      user_input_fields: prev.user_input_fields.filter(
        f => f !== fieldToRemove,
      ),
    }))
  }

  // Handle voice preview playback
  const handlePlayPreview = useCallback(
    (voiceId: string, previewUrl: string, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // If clicking the same voice that's playing, pause it
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
        console.error('Failed to play audio preview:', err)
        setPlayingVoiceId(null)
      })

      audio.onended = () => {
        setPlayingVoiceId(null)
        audioRef.current = null
      }
    },
    [playingVoiceId],
  )

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center mt-10">
        <Loader2 className="size-4 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center gap-2 mt-10">
        <AlertCircle className="size-4 text-destructive" />
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Start Conversation button with debug mode toggle */}
      <div className="flex items-center justify-start gap-4">
        {hasUnsavedChanges ? (
          <Button
            size="sm"
            className="gap-2 bg-purple-600/50 text-white cursor-not-allowed"
            disabled
          >
            Start conversation
            <ExternalLink className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            asChild
          >
            <Link
              href={`/realtime/${agent.username}${
                debugMode ? '?dev=true' : ''
              }`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Start conversation
              <ExternalLink className="w-4 h-4" />
            </Link>
          </Button>
        )}
        <div className="flex items-center gap-2">
          <Checkbox
            id="debug-mode"
            checked={debugMode}
            onCheckedChange={checked => setDebugMode(checked === true)}
          />
          <Label htmlFor="debug-mode" className="text-sm cursor-pointer">
            Debug mode
          </Label>
        </div>
      </div>

      {/* Unsaved changes warning banner */}
      {hasUnsavedChanges && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-amber-500/50 bg-amber-500/10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-200">
              You have unsaved changes. Save your settings before starting a
              conversation.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSubmitting}
            className="shrink-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      )}

      {/* ElevenLabs Settings */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div>
          <h2 className="text-lg font-medium text-foreground">
            ElevenLabs Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure ElevenLabs voice and conversation settings for this agent.
          </p>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select
            value={settings.language}
            onValueChange={value =>
              setSettings(prev => ({ ...prev, language: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* First Message */}
        <div className="space-y-2">
          <Label htmlFor="first_message">First Message</Label>
          <AutosizeTextarea
            id="first_message"
            placeholder="Custom greeting message when conversation starts..."
            value={settings.first_message || ''}
            onChange={e =>
              setSettings(prev => ({
                ...prev,
                first_message: e.target.value || null,
              }))
            }
            className="min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground">
            The message the agent will say when starting a conversation.
          </p>
        </div>

        {/* Voice */}
        <div className="space-y-2">
          <Label htmlFor="voice_id">Voice</Label>

          {/* Voice Filters */}
          <div className="flex flex-wrap items-center gap-4 py-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Gender:</Label>
              <Select
                value={genderFilter}
                onValueChange={(value: 'all' | 'male' | 'female') =>
                  setGenderFilter(value)
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
                id="match-language"
                checked={matchLanguage}
                onCheckedChange={checked => setMatchLanguage(checked === true)}
              />
              <Label
                htmlFor="match-language"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Match language ({settings.language})
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
            {(() => {
              const selectedVoice = voices.find(
                v => v.value === settings.voice_id,
              )
              if (selectedVoice?.previewUrl) {
                return (
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
                )
              }
              return null
            })()}

            <Select
              value={
                isCustomVoice ? CUSTOM_VOICE_VALUE : settings.voice_id || ''
              }
              onValueChange={value => {
                // Stop any playing audio when changing voice
                if (audioRef.current) {
                  audioRef.current.pause()
                  audioRef.current = null
                  setPlayingVoiceId(null)
                }
                if (value === CUSTOM_VOICE_VALUE) {
                  setIsCustomVoice(true)
                  // Keep current custom voice if there is one
                  setSettings(prev => ({
                    ...prev,
                    voice_id: customVoiceId || null,
                  }))
                } else {
                  setIsCustomVoice(false)
                  setCustomVoiceId('')
                  setSettings(prev => ({
                    ...prev,
                    voice_id: value || null,
                  }))
                }
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
                  <>
                    {voices.map(voice => (
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
                    ))}
                    <SelectItem value={CUSTOM_VOICE_VALUE}>
                      <span className="text-muted-foreground">
                        Custom voice ID...
                      </span>
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          {isCustomVoice && (
            <Input
              id="custom_voice_id"
              placeholder="Enter custom ElevenLabs voice ID"
              value={customVoiceId}
              onChange={e => {
                const value = e.target.value
                setCustomVoiceId(value)
                setSettings(prev => ({
                  ...prev,
                  voice_id: value || null,
                }))
              }}
              className="mt-2"
            />
          )}
          <p className="text-xs text-muted-foreground">
            Select a preset voice or enter a custom ElevenLabs voice ID.
          </p>
        </div>

        {/* Stability */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Stability</Label>
            <span className="text-sm text-muted-foreground">
              {settings.tts_stability.toFixed(2)}
            </span>
          </div>
          <Slider
            value={[settings.tts_stability]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={([value]) =>
              setSettings(prev => ({ ...prev, tts_stability: value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Lower values make the voice more expressive but less consistent.
          </p>
        </div>

        {/* Speed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Speed</Label>
            <span className="text-sm text-muted-foreground">
              {settings.tts_speed.toFixed(2)}
            </span>
          </div>
          <Slider
            value={[settings.tts_speed]}
            min={0}
            max={1.2}
            step={0.01}
            onValueChange={([value]) =>
              setSettings(prev => ({ ...prev, tts_speed: value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Adjust the speaking speed (0 - 1.2x).
          </p>
        </div>

        {/* Similarity Boost */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Similarity Boost</Label>
            <span className="text-sm text-muted-foreground">
              {settings.tts_similarity_boost.toFixed(2)}
            </span>
          </div>
          <Slider
            value={[settings.tts_similarity_boost]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={([value]) =>
              setSettings(prev => ({ ...prev, tts_similarity_boost: value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Higher values make the voice closer to the original sample.
          </p>
        </div>
      </div>

      {/* LLM Settings */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-medium text-foreground">LLM Settings</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="llm_model">Model</Label>
            <Select
              value={settings.llm_model}
              onValueChange={value =>
                setSettings(prev => ({
                  ...prev,
                  llm_model: value as RealtimeLLM,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {LLM_OPTIONS.map(model => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Temperature</Label>
              <span className="text-sm text-muted-foreground">
                {settings.temperature.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[settings.temperature]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={([value]) =>
                setSettings(prev => ({ ...prev, temperature: value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Lower values make the output more focused and deterministic.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_tokens">Max Tokens</Label>
            <Select
              value={settings.max_tokens.toString()}
              onValueChange={value =>
                setSettings(prev => ({
                  ...prev,
                  max_tokens: parseInt(value),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select max tokens" />
              </SelectTrigger>
              <SelectContent>
                {MAX_TOKENS_OPTIONS.map(option => (
                  <SelectItem
                    key={option.value}
                    value={option.value.toString()}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* User Input Fields */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-medium text-foreground">
          User Input Fields
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure optional input fields that users must fill in before
          starting a conversation. Leave empty for no required fields.
        </p>

        <div className="space-y-4">
          {/* Current fields */}
          {settings.user_input_fields.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {settings.user_input_fields.map(field => (
                <div
                  key={field}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm"
                >
                  <span>{field}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveField(field)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new field */}
          <div className="flex gap-2">
            <Input
              placeholder="Field label (e.g., Name, Email, Company)"
              value={newFieldLabel}
              onChange={e => setNewFieldLabel(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddField()
                }
              }}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddField}
              disabled={!newFieldLabel.trim()}
            >
              Submit
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            All fields are free-text inputs. Users must fill in all fields
            before starting the conversation (in production mode).
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pb-4">
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  )
}
