'use client'

import { Button } from '@/components/ui/button'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Agent } from '@edenlabs/eden-sdk'
import { useState } from 'react'

export type SessionSettings = {
  type: 'natural' | 'automatic'
  context: string
  conductor_prompt: string
  delay_interval: number
  mention_force_reply: boolean
  manna_budget_unlimited: boolean
  manna_budget?: number
  token_budget_unlimited: boolean
  token_budget?: number
  turn_budget_unlimited: boolean
  turn_budget?: number
  exclude_memory: boolean
}

type SessionSettingsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: SessionSettings
  onSettingsChange: (settings: SessionSettings) => void
  agents: Agent[]
  sessionId?: string
  onSave?: (settings: SessionSettings) => Promise<void>
  minimal?: boolean // For /chat - only show context field
}

export const SessionSettingsModal = ({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  agents,
  sessionId,
  onSave,
  minimal = false,
}: SessionSettingsModalProps) => {
  const isMultiAgent = agents.length > 1
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!onSave) {
      onOpenChange(false)
      return
    }

    try {
      setIsSaving(true)
      await onSave(settings)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save session settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Session Settings</DialogTitle>
          {!minimal && (
            <DialogDescription>
              Configure advanced settings for this session
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Context */}
          <div className="space-y-2">
            <Label>Context</Label>
            <AutosizeTextarea
              value={settings.context}
              onChange={e =>
                onSettingsChange({ ...settings, context: e.target.value })
              }
              placeholder="Describe the scenario or other background information relevant to this session..."
              className={minimal ? 'min-h-[240px]' : 'min-h-[80px]'}
              maxLength={5000}
            />
          </div>

          {/* Exclude Memory */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Exclude Memory</Label>
              <p className="text-sm text-muted-foreground">
                Disable memory injection into the system prompt
              </p>
            </div>
            <Switch
              checked={settings.exclude_memory}
              onCheckedChange={checked =>
                onSettingsChange({
                  ...settings,
                  exclude_memory: checked,
                })
              }
            />
          </div>

          {/* Multi-agent Settings - only show if multiple agents */}
          {isMultiAgent && (
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="font-medium">Multi-agent Settings</h3>

              {/* Session Type */}
              <div className="space-y-2">
                <Label>Session Mode</Label>
                <Select
                  value={settings.type || 'natural'}
                  onValueChange={(value: 'natural' | 'automatic') =>
                    onSettingsChange({ ...settings, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="automatic">Automatic</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  <strong>Natural:</strong> Agents listen and decide when to
                  speak.
                  <br />
                  <strong>Automatic:</strong> Agents play out entire scenario.
                </p>
              </div>

              {/* Reply Delay */}
              <div className="space-y-2">
                <Label>Reply Delay</Label>
                <Select
                  value={settings.delay_interval.toString()}
                  onValueChange={value =>
                    onSettingsChange({
                      ...settings,
                      delay_interval: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Instant</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="1800">30 minutes</SelectItem>
                    <SelectItem value="10800">3 hours</SelectItem>
                    <SelectItem value="86400">1 day</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Time delay between agent responses
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {sessionId && onSave && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
          {!sessionId && (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
