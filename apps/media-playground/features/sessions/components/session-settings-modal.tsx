'use client'

import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'

export type SessionSettings = {
  type: 'passive' | 'automatic'
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
  const [isBudgetOpen, setIsBudgetOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Debug: log settings when modal opens
  useEffect(() => {
    if (open) {
      // SessionSettingsModal opened with settings
    }
  }, [open, settings])

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
          {/* Session Type */}
          {!minimal && (
            <div className="space-y-2">
              <Label>Session Mode</Label>
              <Select
                value={settings.type || 'passive'}
                onValueChange={(value: 'passive' | 'automatic') =>
                  onSettingsChange({ ...settings, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passive">Passive</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                <strong>Passive:</strong> Agents listen and decide when to
                speak.
                <br />
                <strong>Automatic:</strong> One agent always responds to a new
                message, playing out the entire scenario.
              </p>
            </div>
          )}

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
            {!minimal && (
              <p className="text-sm text-muted-foreground">
                The context is where you describe the scenario or other
                background information relevant to this session (max 5000
                characters)
              </p>
            )}
          </div>

          {/* Conductor Prompt */}
          {!minimal && isMultiAgent && (
            <div className="space-y-2">
              <Label>Conductor Prompt (Optional)</Label>
              <AutosizeTextarea
                value={settings.conductor_prompt}
                onChange={e =>
                  onSettingsChange({
                    ...settings,
                    conductor_prompt: e.target.value,
                  })
                }
                placeholder="Describe how agents should be selected to speak..."
                className="min-h-[80px]"
                maxLength={2000}
              />
              <p className="text-sm text-muted-foreground">
                The conductor prompt determines how agents are selected to speak
                or under what circumstances they will speak (max 2000
                characters)
              </p>
            </div>
          )}

          {/* Reply Delay */}
          {!minimal && (
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
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Time delay between agent responses
              </p>
            </div>
          )}

          {/* Mention Force Reply */}
          {!minimal && isMultiAgent && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mention Force Reply</Label>
                <p className="text-sm text-muted-foreground">
                  If you mention a specific agent in a message, they will always
                  respond
                </p>
              </div>
              <Switch
                checked={settings.mention_force_reply}
                onCheckedChange={checked =>
                  onSettingsChange({
                    ...settings,
                    mention_force_reply: checked,
                  })
                }
              />
            </div>
          )}

          {/* Budget Settings - Collapsible */}
          {!minimal && (
            <Collapsible open={isBudgetOpen} onOpenChange={setIsBudgetOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Label className="cursor-pointer">Budget Settings</Label>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isBudgetOpen ? 'rotate-180' : ''
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {/* Manna Budget */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Manna Budget</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Unlimited
                      </span>
                      <Switch
                        checked={settings.manna_budget_unlimited}
                        onCheckedChange={checked =>
                          onSettingsChange({
                            ...settings,
                            manna_budget_unlimited: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                  {!settings.manna_budget_unlimited && (
                    <Input
                      type="number"
                      min={100}
                      max={50000}
                      value={settings.manna_budget || ''}
                      onChange={e =>
                        onSettingsChange({
                          ...settings,
                          manna_budget: parseInt(e.target.value) || undefined,
                        })
                      }
                      placeholder="Enter manna budget (100-50000)"
                    />
                  )}
                </div>

                {/* Token Budget */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Token Budget</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Unlimited
                      </span>
                      <Switch
                        checked={settings.token_budget_unlimited}
                        onCheckedChange={checked =>
                          onSettingsChange({
                            ...settings,
                            token_budget_unlimited: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                  {!settings.token_budget_unlimited && (
                    <Input
                      type="number"
                      min={1000}
                      max={1000000}
                      value={settings.token_budget || ''}
                      onChange={e =>
                        onSettingsChange({
                          ...settings,
                          token_budget: parseInt(e.target.value) || undefined,
                        })
                      }
                      placeholder="Enter token budget (1000-1000000)"
                    />
                  )}
                </div>

                {/* Turn Budget */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Turn Budget</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Unlimited
                      </span>
                      <Switch
                        checked={settings.turn_budget_unlimited}
                        onCheckedChange={checked =>
                          onSettingsChange({
                            ...settings,
                            turn_budget_unlimited: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                  {!settings.turn_budget_unlimited && (
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      value={settings.turn_budget || ''}
                      onChange={e =>
                        onSettingsChange({
                          ...settings,
                          turn_budget: parseInt(e.target.value) || undefined,
                        })
                      }
                      placeholder="Enter turn budget (1-1000)"
                    />
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
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
