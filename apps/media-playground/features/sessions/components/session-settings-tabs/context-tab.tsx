'use client'

import { SessionSettings } from '../session-settings-modal'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

type ContextTabProps = {
  settings: SessionSettings
  onSettingsChange: (settings: SessionSettings) => void
  isMultiAgent: boolean
}

export const ContextTab = ({
  settings,
  onSettingsChange,
  isMultiAgent,
}: ContextTabProps) => {
  return (
    <div className="space-y-6">
      {/* Context */}
      <div className="space-y-2">
        <Label>Context</Label>
        <p className="text-sm text-muted-foreground">
          This is information which should remain in context at all times, such
          as background info, special rules, or custom instructions.
        </p>
        <AutosizeTextarea
          value={settings.context}
          onChange={e =>
            onSettingsChange({ ...settings, context: e.target.value })
          }
          placeholder="Describe the scenario or other background information relevant to this session..."
          className="min-h-[120px]"
          maxLength={5000}
        />
      </div>

      {/* Incognito Mode */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label>Incognito</Label>
          <p className="text-sm text-muted-foreground">
            No memories will be formed from this session
          </p>
        </div>
        <Switch
          checked={settings.incognito}
          onCheckedChange={checked =>
            onSettingsChange({
              ...settings,
              incognito: checked,
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
              onValueChange={(value: 'passive' | 'natural' | 'automatic') =>
                onSettingsChange({ ...settings, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passive">Passive</SelectItem>
                <SelectItem value="natural">Natural</SelectItem>
                <SelectItem value="automatic">Automatic</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              <strong>Passive:</strong> Agents respond only when mentioned.
              <br />
              <strong>Natural:</strong> Agents listen and decide when to speak.
              <br />
              <strong>Automatic:</strong> Agents play out entire scenario.
            </p>
          </div>

          {/* Reply Delay - only show for automatic mode */}
          {settings.type === 'automatic' && (
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
                  <SelectItem value="10">10 seconds</SelectItem>
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
          )}
        </div>
      )}
    </div>
  )
}
