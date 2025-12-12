'use client'

import { ContextTab, ParticipantsTab, TasksTab } from './session-settings-tabs'
import TaskFormModal from './task-form-modal'
import { Button } from '@/components/ui/button'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Agent, SessionPermission } from '@edenlabs/eden-sdk'
import { Trigger } from '@edenlabs/eden-sdk'
import {
  AlertTriangle,
  ClockIcon,
  FileTextIcon,
  Loader2,
  SettingsIcon,
  UsersIcon,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

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

type SessionSettingsTab = 'participants' | 'context' | 'tasks'

type SessionSettingsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: SessionSettings
  onSettingsChange: (settings: SessionSettings) => void
  agents: Agent[]
  sessionId?: string
  sessionTitle?: string // Title of the session to display in header
  onSave?: (settings: SessionSettings, agents?: Agent[]) => Promise<void>
  onAgentsChange?: (agents: Agent[]) => void
  minimal?: boolean // For /chat - only show context field
  initialTab?: SessionSettingsTab
}

const sessionTabs: Array<{
  key: SessionSettingsTab
  label: string
  icon: typeof UsersIcon
  description: string
}> = [
  {
    key: 'participants',
    label: 'Participants',
    icon: UsersIcon,
    description: 'Manage agents and invite users to this session.',
  },
  {
    key: 'context',
    label: 'Context',
    icon: FileTextIcon,
    description: 'Configure session context and memory settings.',
  },
  {
    key: 'tasks',
    label: 'Tasks',
    icon: ClockIcon,
    description: 'Schedule automated tasks for your agents.',
  },
]

export const SessionSettingsModal = ({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  agents,
  sessionId,
  sessionTitle,
  onSave,
  onAgentsChange,
  minimal = false,
  initialTab = 'participants',
}: SessionSettingsModalProps) => {
  const isMultiAgent = agents.length > 1
  const [activeTab, setActiveTab] = useState<SessionSettingsTab>(initialTab)
  const [isSaving, setIsSaving] = useState(false)
  const [permissions, setPermissions] = useState<SessionPermission[]>([])
  const [isPermissionsLoading, setIsPermissionsLoading] = useState(false)
  const [isSavingPermissions, setIsSavingPermissions] = useState(false)

  // Agent state for Participants tab
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>(agents)
  const [hasAgentChanges, setHasAgentChanges] = useState(false)

  // Task form modal state (rendered outside Dialog to avoid unmounting)
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Trigger | null>(null)

  // Track if we're closing to open task modal (should reopen on Tasks tab)
  const closingForTaskModal = useRef(false)

  // Track initial values for unsaved changes detection
  const initialSettingsRef = useRef<SessionSettings | null>(null)
  const initialPermissionsRef = useRef<SessionPermission[] | null>(null)

  // Confirmation dialog for unsaved changes
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] =
    useState(false)

  // Store a ref to settings for capturing initial value without causing re-renders
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  // Reset tab and agent state when modal opens
  useEffect(() => {
    if (open) {
      // If reopening from task modal, stay on Tasks tab
      if (closingForTaskModal.current) {
        setActiveTab('tasks')
        closingForTaskModal.current = false
      } else {
        setActiveTab(initialTab)
        // Store initial settings for comparison (only on fresh open, not task modal reopen)
        initialSettingsRef.current = { ...settingsRef.current }
      }
      setSelectedAgents(agents)
      setHasAgentChanges(false)
    } else {
      // Reset initial refs when modal closes
      initialSettingsRef.current = null
      initialPermissionsRef.current = null
    }
  }, [open, initialTab, agents])

  // Fetch existing permissions when opening
  useEffect(() => {
    if (!open || !sessionId) return
    setIsPermissionsLoading(true)
    fetch(`/api/sessions/${sessionId}/permissions`)
      .then(res => res.json())
      .then(data => {
        if (data.permissions) {
          setPermissions(data.permissions)
          // Store initial permissions for comparison
          initialPermissionsRef.current = JSON.parse(
            JSON.stringify(data.permissions),
          )
        }
      })
      .catch(err => {
        console.error('Failed to fetch permissions:', err)
      })
      .finally(() => setIsPermissionsLoading(false))
  }, [open, sessionId])

  // Track agent changes
  const handleAgentsChange = (newAgents: Agent[]) => {
    setSelectedAgents(newAgents)
    setHasAgentChanges(true)
    onAgentsChange?.(newAgents)
  }

  const persistPermissions = async () => {
    if (!sessionId) return
    setIsSavingPermissions(true)
    try {
      const payload = permissions
        .filter(p => p.user?.username)
        .map(p => ({
          username: p.user!.username,
          level: p.level as 'owner' | 'editor' | 'participant' | 'viewer',
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

      // Save with updated agents if changed
      await onSave(settings, hasAgentChanges ? selectedAgents : undefined)
      await persistPermissions()

      setHasAgentChanges(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save session settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Compute unsaved changes state
  const hasSettingsChanges = (() => {
    if (!initialSettingsRef.current) return false
    const initial = initialSettingsRef.current
    return (
      settings.type !== initial.type ||
      settings.context !== initial.context ||
      settings.delay_interval !== initial.delay_interval ||
      settings.exclude_memory !== initial.exclude_memory
    )
  })()

  const hasPermissionsChanges = (() => {
    if (!initialPermissionsRef.current) return false
    const initial = initialPermissionsRef.current
    if (permissions.length !== initial.length) return true
    // Compare each permission
    return permissions.some((p, i) => {
      const initP = initial[i]
      return (
        p.user?.username !== initP?.user?.username || p.level !== initP?.level
      )
    })
  })()

  const hasUnsavedChanges =
    activeTab !== 'tasks' &&
    (hasAgentChanges || hasSettingsChanges || hasPermissionsChanges)

  // Handler for closing with unsaved changes check
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      // Allow opening, only check on close
      if (!newOpen && hasUnsavedChanges) {
        setShowUnsavedChangesDialog(true)
        return
      }
      onOpenChange(newOpen)
    },
    [hasUnsavedChanges, onOpenChange],
  )

  // Handler for confirming close with unsaved changes
  const handleConfirmClose = useCallback(() => {
    setShowUnsavedChangesDialog(false)
    onOpenChange(false)
  }, [onOpenChange])

  // Open task form modal (closes settings modal first)
  const handleOpenTaskForm = useCallback(
    (trigger?: Trigger) => {
      setEditingTask(trigger || null)
      closingForTaskModal.current = true
      onOpenChange(false)
      // Small delay to ensure settings modal closes before task form opens
      setTimeout(() => {
        setIsTaskFormOpen(true)
      }, 100)
    },
    [onOpenChange],
  )

  // Handle task form modal close (reopens settings modal)
  const handleTaskFormClose = useCallback(
    (open: boolean) => {
      setIsTaskFormOpen(open)
      if (!open) {
        setEditingTask(null)
        // Reopen settings modal on Tasks tab
        onOpenChange(true)
      }
    },
    [onOpenChange],
  )

  // Handle task form save
  const handleTaskFormSave = useCallback(() => {
    setEditingTask(null)
  }, [])

  // Minimal mode - just show context field (used in /chat launchpad)
  if (minimal) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Context</DialogTitle>
            <DialogDescription>
              Session context is important information about this session which
              remains in context at all times, including things like multi-step
              workflows, special rules, etc.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Context</Label>
              <p className="text-sm text-muted-foreground">
                This is information which should remain in context at all times,
                such as background info, special rules, or custom instructions.
              </p>
              <AutosizeTextarea
                value={settings.context}
                onChange={e =>
                  onSettingsChange({ ...settings, context: e.target.value })
                }
                placeholder="Describe the scenario or other background information relevant to this session..."
                className="min-h-[240px]"
                maxLength={5000}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Full tabbed modal (when not minimal)
  const currentTab = sessionTabs.find(tab => tab.key === activeTab)
  const showSaveButton = activeTab !== 'tasks'

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 [&>button]:hidden">
          <DialogTitle className="sr-only">Session Settings</DialogTitle>
          <div className="flex flex-col md:flex-row h-full overflow-hidden">
            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden md:flex w-56 border-r bg-muted/30 flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <SettingsIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-lg leading-tight">
                      Settings
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {sessionTitle || 'Session'}
                    </p>
                  </div>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {sessionTabs.map(tab => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left',
                          activeTab === tab.key
                            ? 'bg-background text-foreground font-medium shadow-sm'
                            : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Mobile Header with Dropdown Tabs */}
            <div className="md:hidden border-b bg-background">
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <SettingsIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-base leading-tight">
                      Settings
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {sessionTitle || 'Session'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-full px-4 py-3">
                <Select
                  value={activeTab}
                  onValueChange={value =>
                    setActiveTab(value as SessionSettingsTab)
                  }
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label="Select settings tab"
                  >
                    <SelectValue placeholder="Select tab" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionTabs.map(tab => {
                      const Icon = tab.icon
                      return (
                        <SelectItem key={tab.key} value={tab.key}>
                          <span className="inline-flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5" />
                            {tab.label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1">
                <div className="p-6">
                  {currentTab && (
                    <div className="mb-8 space-y-2">
                      <h1 className="text-3xl font-semibold">
                        {currentTab.label}
                      </h1>
                      <p className="text-sm text-muted-foreground max-w-2xl">
                        {currentTab.description}
                      </p>
                    </div>
                  )}

                  {/* Tab Content */}
                  {activeTab === 'participants' && (
                    <ParticipantsTab
                      agents={selectedAgents}
                      onAgentsChange={handleAgentsChange}
                      permissions={permissions}
                      onPermissionsChange={setPermissions}
                      sessionId={sessionId}
                      isPermissionsLoading={isPermissionsLoading}
                      isSavingPermissions={isSavingPermissions}
                    />
                  )}

                  {activeTab === 'context' && (
                    <ContextTab
                      settings={settings}
                      onSettingsChange={onSettingsChange}
                      isMultiAgent={isMultiAgent}
                    />
                  )}

                  {activeTab === 'tasks' && (
                    <TasksTab
                      isModalOpen={open}
                      sessionId={sessionId}
                      onOpenTaskForm={handleOpenTaskForm}
                    />
                  )}
                </div>
              </ScrollArea>

              {/* Action Footer - only for Participants and Context tabs */}
              {showSaveButton && (
                <div className="border-t p-4 bg-background flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  {/* Unsaved changes warning */}
                  <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-sm text-amber-500">
                          You have unsaved changes
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    {sessionId && onSave && (
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full md:w-auto"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    )}
                    {!sessionId && (
                      <Button onClick={() => handleOpenChange(false)}>
                        Done
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Form Modal - rendered outside Dialog to avoid unmounting when settings closes */}
      <TaskFormModal
        sessionId={sessionId}
        editingTask={editingTask}
        open={isTaskFormOpen}
        onOpenChange={handleTaskFormClose}
        onSave={handleTaskFormSave}
      />

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog
        open={showUnsavedChangesDialog}
        onOpenChange={setShowUnsavedChangesDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes to your session settings. Are you sure
              you want to close without saving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowUnsavedChangesDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmClose}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
