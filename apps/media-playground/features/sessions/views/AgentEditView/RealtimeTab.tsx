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
import type { RealtimeLLM } from '@/lib/voice/realtime-defaults'
import { Agent } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { AlertCircle, ExternalLink, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { FC, useEffect, useState } from 'react'
import { toast } from 'sonner'

// LLM options derived from RealtimeLLM type
const LLM_OPTIONS: { value: RealtimeLLM; label: string }[] = [
  { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
  { value: 'gpt-5', label: 'GPT-5' },
  { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
  { value: 'gpt-5-nano', label: 'GPT-5 Nano' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
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
    agent: agent._id,
    voice_id: null,
    language: 'en',
    first_message: null,
    llm_model: 'claude-haiku-4-5',
    temperature: 0.8,
    max_tokens: 4096,
    tts_stability: 0.5,
    tts_speed: 1.0,
    tts_similarity_boost: 0.3,
    user_input_fields: [],
  })

  // State for adding new user input field
  const [newFieldLabel, setNewFieldLabel] = useState('')

  // State for debug mode checkbox (default enabled)
  const [debugMode, setDebugMode] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await axios.get(`/api/agents/${agent._id}/realtime`)
        if (response.data?.settings) {
          // Merge with defaults to ensure all fields exist
          setSettings(prev => ({
            ...prev,
            ...response.data.settings,
            // Ensure user_input_fields is always an array
            user_input_fields: response.data.settings.user_input_fields || [],
          }))
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
        <Button
          size="sm"
          className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          asChild
        >
          <Link
            href={`/realtime/${agent.username}${debugMode ? '?dev=true' : ''}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Start conversation
            <ExternalLink className="w-4 h-4" />
          </Link>
        </Button>
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

      {/* ElevenLabs Configuration */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-medium text-foreground">
          ElevenLabs Configuration
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure ElevenLabs voice and speech settings for this agent.
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="voice_id">Voice ID</Label>
            <Input
              id="voice_id"
              placeholder="Optional: ElevenLabs voice ID"
              value={settings.voice_id || ''}
              onChange={e =>
                setSettings(prev => ({
                  ...prev,
                  voice_id: e.target.value || null,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Custom ElevenLabs voice ID for this agent.
            </p>
          </div>

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
      </div>

      {/* Conversation Settings */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-medium text-foreground">
          Conversation Settings
        </h2>

        <div className="space-y-4">
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
