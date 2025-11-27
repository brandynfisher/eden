'use client'

import { Button } from '@/components/ui/button'
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
import { Agent } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { AlertCircle, Loader2 } from 'lucide-react'
import { FC, useEffect, useState } from 'react'
import { toast } from 'sonner'

// LLM options available in ElevenLabs
const LLM_OPTIONS = [
  { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
  { value: 'gpt-5', label: 'GPT-5' },
  { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
  { value: 'gpt-5-nano', label: 'GPT-5 Nano' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
] as const

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
  elevenlabs_agent_id: string | null
  voice_id: string | null
  language: string
  first_message: string | null
  llm_model: string
  temperature: number
  max_tokens: number
  tts_stability: number
  tts_speed: number
  tts_similarity_boost: number
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
    elevenlabs_agent_id: null,
    voice_id: null,
    language: 'en',
    first_message: null,
    llm_model: 'claude-sonnet-4-5',
    temperature: 0.7,
    max_tokens: 4096,
    tts_stability: 0.45,
    tts_speed: 1.0,
    tts_similarity_boost: 0.25,
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await axios.get(`/api/agents/${agent._id}/realtime`)
        if (response.data?.settings) {
          setSettings(response.data.settings)
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
        elevenlabs_agent_id: settings.elevenlabs_agent_id || undefined,
        voice_id: settings.voice_id || undefined,
        language: settings.language,
        first_message: settings.first_message || undefined,
        llm_model: settings.llm_model,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens,
        tts_stability: settings.tts_stability,
        tts_speed: settings.tts_speed,
        tts_similarity_boost: settings.tts_similarity_boost,
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
      {/* ElevenLabs Configuration */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-medium text-foreground">
          ElevenLabs Configuration
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure ElevenLabs-specific settings for this agent.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="elevenlabs_agent_id">ElevenLabs Agent ID</Label>
            <Input
              id="elevenlabs_agent_id"
              placeholder="Optional: Override the default ElevenLabs agent ID"
              value={settings.elevenlabs_agent_id || ''}
              onChange={e =>
                setSettings(prev => ({
                  ...prev,
                  elevenlabs_agent_id: e.target.value || null,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the default ElevenLabs agent.
            </p>
          </div>

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
                setSettings(prev => ({ ...prev, llm_model: value }))
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
            <Input
              id="max_tokens"
              type="number"
              min={1}
              max={16384}
              value={settings.max_tokens}
              onChange={e =>
                setSettings(prev => ({
                  ...prev,
                  max_tokens: parseInt(e.target.value) || 4096,
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* TTS Settings */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-medium text-foreground">
          Text-to-Speech Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure how the agent&apos;s voice sounds.
        </p>

        <div className="space-y-6">
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
