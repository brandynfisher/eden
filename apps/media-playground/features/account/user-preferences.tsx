'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthState } from '@/hooks/use-auth-state'
import { GenerationQuality } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { Settings } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

const GENERATION_IMAGE_MODEL_OPTIONS = [
  { value: 'nano_banana', label: 'Nano Banana' },
  { value: 'seedream', label: 'Seedream' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'flux', label: 'Flux' },
]

const GENERATION_VIDEO_MODEL_OPTIONS = [
  { value: 'kling', label: 'Kling' },
  { value: 'wan', label: 'Wan' },
  { value: 'seedance', label: 'Seedance' },
  { value: 'veo', label: 'Veo' },
]

export function UserPreferences() {
  const { user, refetchMe } = useAuthState()
  const generation = user?.preferences?.generation

  const [defaultQuality, setDefaultQuality] =
    useState<GenerationQuality>('standard')
  const [imageModel, setImageModel] = useState<string | null>(null)
  const [videoModel, setVideoModel] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setDefaultQuality(generation?.default_quality || 'standard')
    setImageModel(generation?.image_model_preference ?? null)
    setVideoModel(generation?.video_model_preference ?? null)
  }, [generation])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await axios.post('/api/creators/update', {
        preferences: {
          generation: {
            default_quality: defaultQuality,
            image_model_preference: imageModel,
            video_model_preference: videoModel,
          },
        },
      })
      toast.success('Preferences saved', {
        richColors: true,
        dismissible: true,
      })
      await refetchMe()
    } catch (error) {
      toast.error('Failed to save preferences', {
        description: 'Please try again later.',
        richColors: true,
        dismissible: true,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Preferences</CardTitle>
        </div>
        <CardDescription>
          Manage your account preferences and settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default Quality */}
        <div className="space-y-2">
          <Label>Default quality</Label>
          <div className="space-y-3">
            {/* Standard Option */}
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                defaultQuality === 'standard'
                  ? 'border-primary bg-card text-foreground'
                  : 'border-muted bg-muted/50 text-muted-foreground hover:border-muted-foreground/50'
              }`}
              onClick={() => setDefaultQuality('standard')}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1">
                    Standard (recommended)
                  </div>
                  <p className="text-xs opacity-70">
                    Agents use cost-effective models unless you explicitly ask
                    for high quality.
                  </p>
                </div>
                <div className="ml-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      defaultQuality === 'standard'
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/50'
                    }`}
                  >
                    {defaultQuality === 'standard' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* High Quality Option */}
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                defaultQuality === 'pro'
                  ? 'border-primary bg-card text-foreground'
                  : 'border-muted bg-muted/50 text-muted-foreground hover:border-muted-foreground/50'
              }`}
              onClick={() => setDefaultQuality('pro')}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1">High quality</div>
                  <p className="text-xs opacity-70">
                    Agents default to premium/pro models unless you ask to save
                    cost. Warning: pro generations typically cost 2-5x more
                    manna.
                  </p>
                </div>
                <div className="ml-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      defaultQuality === 'pro'
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/50'
                    }`}
                  >
                    {defaultQuality === 'pro' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preferred Image Model */}
        <div className="space-y-2">
          <Label>Preferred image model</Label>
          <Select
            value={imageModel ?? 'auto'}
            onValueChange={value =>
              setImageModel(value === 'auto' ? null : value)
            }
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Auto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              {GENERATION_IMAGE_MODEL_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preferred Video Model */}
        <div className="space-y-2">
          <Label>Preferred video model</Label>
          <Select
            value={videoModel ?? 'auto'}
            onValueChange={value =>
              setVideoModel(value === 'auto' ? null : value)
            }
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Auto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              {GENERATION_VIDEO_MODEL_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-fit">
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardContent>
    </Card>
  )
}
