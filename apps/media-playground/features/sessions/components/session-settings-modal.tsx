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
import {
  Agent,
  SessionPermission,
  SessionPermissionLevel,
} from '@edenlabs/eden-sdk'
import {
  EyeIcon,
  Loader2,
  MessageSquareIcon,
  ShieldIcon,
  UserIcon,
  XIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export type SessionSettings = {
  type: 'passive' | 'natural' | 'automatic'
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

type PermissionLevelOption = 'owner' | 'editor' | 'participant' | 'viewer'

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
  const [permissions, setPermissions] = useState<SessionPermission[]>([])
  const [isPermissionsLoading, setIsPermissionsLoading] = useState(false)
  const [isSavingPermissions, setIsSavingPermissions] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [permissionLevel, setPermissionLevel] =
    useState<PermissionLevelOption>('participant')

  // Fetch existing permissions when opening
  useEffect(() => {
    if (!open || !sessionId) return
    setIsPermissionsLoading(true)
    fetch(`/api/sessions/${sessionId}/permissions`)
      .then(res => res.json())
      .then(data => {
        if (data.permissions) {
          setPermissions(data.permissions)
        }
      })
      .catch(err => {
        console.error('Failed to fetch permissions:', err)
      })
      .finally(() => setIsPermissionsLoading(false))
  }, [open, sessionId])

  const grouped = useMemo(() => {
    const by = {
      owner: [] as SessionPermission[],
      editor: [] as SessionPermission[],
      participant: [] as SessionPermission[],
      viewer: [] as SessionPermission[],
    }
    permissions.forEach(p => {
      const level = p.level as PermissionLevelOption
      if (by[level]) by[level].push(p)
    })
    return by
  }, [permissions])

  const handleAddPermission = () => {
    const username = newUsername.trim()
    if (!username) return
    const exists = permissions.some(p => p.user?.username === username)
    if (exists) return
    setPermissions(prev => [
      ...prev,
      {
        _id: `temp-${Date.now()}`,
        session: sessionId || '',
        user: { _id: '', username },
        level: permissionLevel as SessionPermissionLevel,
        grantedAt: new Date(),
      } as SessionPermission,
    ])
    setNewUsername('')
  }

  const handleRemovePermission = (username: string) => {
    setPermissions(prev => prev.filter(p => p.user?.username !== username))
  }

  const persistPermissions = async () => {
    if (!sessionId) return
    setIsSavingPermissions(true)
    try {
      const payload = permissions
        .filter(p => p.user?.username)
        .map(p => ({
          username: p.user!.username,
          level: p.level as PermissionLevelOption,
        }))

      const res = await fetch(`/api/sessions/${sessionId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: payload }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update permissions')
      }
    } finally {
      setIsSavingPermissions(false)
    }
  }

  const handleSave = async () => {
    if (!onSave) {
      onOpenChange(false)
      return
    }

    try {
      setIsSaving(true)
      await onSave(settings)
      await persistPermissions()
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
          <DialogTitle>
            {isMultiAgent ? 'Session Settings' : 'Add Context'}
          </DialogTitle>
          {!minimal && (
            <DialogDescription>
              {isMultiAgent
                ? 'Configure advanced settings for this session'
                : 'Session context is important information about this session which remains in context at all times, including things like multi-step workflows, special rules, etc.'}
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
            {!isMultiAgent && minimal && (
              <p className="text-sm text-muted-foreground">
                This information will remain in context at all times, including
                things like multi-step workflows, special rules, or important
                background information.
              </p>
            )}
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
                  <strong>Natural:</strong> Agents listen and decide when to
                  speak.
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

          {/* Permissions - only when not minimal and sessionId present */}
          {!minimal && sessionId && (
            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-medium">Session Permissions</h3>
                  <p className="text-sm text-muted-foreground">
                    Invite Eden users as owners, editors, participants, or
                    viewers. Participants can interact; viewers are read-only
                    but can open private sessions.
                  </p>
                </div>
                {(isPermissionsLoading || isSavingPermissions) && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="Enter Eden username..."
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddPermission()
                    }
                  }}
                  disabled={isSavingPermissions}
                  className="flex-1"
                />
                <Select
                  value={permissionLevel}
                  onValueChange={value =>
                    setPermissionLevel(value as PermissionLevelOption)
                  }
                  disabled={isSavingPermissions}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="participant">Participant</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddPermission}
                  type="button"
                  disabled={!newUsername.trim() || isSavingPermissions}
                >
                  Add
                </Button>
              </div>

              {['owner', 'editor', 'participant', 'viewer'].map(level => {
                const list = grouped[level as PermissionLevelOption]
                if (!list?.length) return null
                const label =
                  level === 'owner'
                    ? 'Owners'
                    : level === 'editor'
                    ? 'Editors'
                    : level === 'participant'
                    ? 'Participants'
                    : 'Viewers'
                const Icon =
                  level === 'owner'
                    ? ShieldIcon
                    : level === 'editor'
                    ? UserIcon
                    : level === 'participant'
                    ? MessageSquareIcon
                    : EyeIcon
                const badge =
                  level.charAt(0).toUpperCase() + level.slice(1).toLowerCase()
                return (
                  <div key={level} className="space-y-2">
                    <Label className="text-sm font-medium">{label}</Label>
                    <div className="space-y-2">
                      {list.map(permission => (
                        <div
                          key={permission.user?.username || permission._id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">
                              {permission.user?.username || 'Unknown user'}
                            </span>
                            <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                              {badge}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemovePermission(
                                permission.user?.username || '',
                              )
                            }
                            type="button"
                            className="hover:bg-destructive hover:text-destructive-foreground"
                            disabled={isSavingPermissions}
                          >
                            <XIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
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
