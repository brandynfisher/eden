'use client'

import LockedFeatureBanner from '@/components/gated/locked-feature-banner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useAuthState } from '@/hooks/use-auth-state'
import { GatedResource, useGatedResource } from '@/hooks/use-gated-resource'
import {
  Agent,
  AgentPermission,
  AgentPermissionLevel,
} from '@edenlabs/eden-sdk'
import axios, { AxiosError } from 'axios'
import { Loader2, ShieldIcon, UserIcon, XIcon } from 'lucide-react'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

type AgentPermissionLevelType = 'editor' | 'owner'
type OwnerPaysOption = 'off' | 'deployments' | 'full'

interface PayerSettingsProps {
  agent: Agent
}

const PayerSettings: FC<PayerSettingsProps> = ({ agent }) => {
  // Convert legacy boolean values to new string format
  const getInitialValue = (): OwnerPaysOption => {
    if (typeof agent.owner_pays === 'boolean') {
      return agent.owner_pays ? 'full' : 'off'
    }
    if (
      agent.owner_pays === 'off' ||
      agent.owner_pays === 'deployments' ||
      agent.owner_pays === 'full'
    ) {
      return agent.owner_pays
    }
    return 'off'
  }

  const [ownerPays, setOwnerPays] = useState<OwnerPaysOption>(getInitialValue())
  const [savedOwnerPays, setSavedOwnerPays] = useState<OwnerPaysOption>(
    getInitialValue(),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasUnsavedChanges = useMemo(() => {
    return ownerPays !== savedOwnerPays
  }, [ownerPays, savedOwnerPays])

  const handleSave = useCallback(async () => {
    setIsSubmitting(true)
    try {
      // Send complete agent data to prevent field deletion
      const updatePayload = {
        name: agent.name,
        key: agent.username,
        description: agent.description,
        persona: agent.persona,
        public: agent.public,
        knowledge: agent.knowledge ?? '',
        greeting: agent.greeting || '',
        voice: agent.voice || '',
        models: agent.models || [],
        tools: agent.tools || {},
        llm_settings: agent.llm_settings || {},
        owner_pays: ownerPays,
      }

      await axios.patch(`/api/agents/${agent._id}`, updatePayload)
      setSavedOwnerPays(ownerPays)
      toast.success('Payer settings updated successfully', {
        description: 'Your changes have been saved.',
        richColors: true,
        dismissible: true,
      })
    } catch (error) {
      toast.error('Failed to update payer settings', {
        description: 'Please try again later.',
        richColors: true,
        dismissible: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [agent, ownerPays])

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">Payer Settings</h2>
      <div className="p-6 bg-card rounded-xl border border-border">
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium">Cover Usage Costs</label>
            <div className="space-y-2">
              <ToggleGroup
                type="single"
                value={ownerPays}
                onValueChange={value =>
                  value && setOwnerPays(value as OwnerPaysOption)
                }
                className="flex flex-col items-stretch gap-2"
              >
                <ToggleGroupItem
                  value="off"
                  className="flex flex-col items-start justify-start h-auto p-2.5 border border-border/50 rounded-md data-[state=on]:bg-primary/20 data-[state=on]:border-primary data-[state=on]:text-primary-foreground hover:bg-accent/50 transition-colors"
                >
                  <div className="font-medium text-sm">Off</div>
                  <div className="text-xs text-muted-foreground data-[state=on]:text-primary-foreground/80 mt-0.5">
                    Users pay for their own usage.
                  </div>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="deployments"
                  className="flex flex-col items-start justify-start h-auto p-2.5 border border-border/50 rounded-md data-[state=on]:bg-primary/20 data-[state=on]:border-primary data-[state=on]:text-primary-foreground hover:bg-accent/50 transition-colors"
                >
                  <div className="font-medium text-sm">Deployments only</div>
                  <div className="text-xs text-muted-foreground data-[state=on]:text-primary-foreground/80 mt-0.5">
                    Agent owner covers all usage costs on social platforms and
                    deployments only.
                  </div>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="full"
                  className="flex flex-col items-start justify-start h-auto p-2.5 border border-border/50 rounded-md data-[state=on]:bg-primary/20 data-[state=on]:border-primary data-[state=on]:text-primary-foreground hover:bg-accent/50 transition-colors"
                >
                  <div className="font-medium text-sm">Full</div>
                  <div className="text-xs text-muted-foreground data-[state=on]:text-primary-foreground/80 mt-0.5">
                    Agent owner covers all costs, including the main Eden app.
                  </div>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button
            onClick={handleSave}
            disabled={isSubmitting || !hasUnsavedChanges}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              'Update'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export const PermissionsTab: FC<{ agent: Agent }> = ({ agent }) => {
  const { user } = useAuthState()
  const [permissions, setPermissions] = useState<AgentPermission[]>([])
  const [newUsername, setNewUsername] = useState('')
  const [permissionLevel, setPermissionLevel] =
    useState<AgentPermissionLevelType>('editor')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const permissionsGate = useGatedResource(GatedResource.AgentPermissions, {
    lockedBehavior: 'modal',
  })
  const hasOwnerAccess = !!agent?.owner?._id && agent.owner._id === user?._id
  const isSubscriptionAllowed = permissionsGate.isAllowed
  const isFormDisabled =
    isSubmitting || !isSubscriptionAllowed || !hasOwnerAccess

  // Fetch current permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axios.get(`/api/agents/${agent._id}/permissions`)
        setPermissions(response.data.permissions || [])
      } catch (error) {
        console.error('Failed to fetch permissions:', error)
        toast.error('Failed to load permissions')
      } finally {
        setIsLoading(false)
      }
    }
    fetchPermissions()
  }, [agent._id])

  const handleAddUser = async () => {
    if (!hasOwnerAccess) return
    if (!permissionsGate.isAllowed) {
      permissionsGate.openGate()
      return
    }
    if (!newUsername.trim()) return

    // Check if user already has permission
    const existingPermission = permissions.find(
      p => p.user.username === newUsername.trim(),
    )
    if (existingPermission) {
      toast.error('User already has permissions for this agent')
      return
    }

    setIsSubmitting(true)
    try {
      // Prepare the full permissions list with the new user
      const permissionsList = [
        ...permissions.map(p => ({
          username: p.user.username,
          level: p.level as AgentPermissionLevelType,
        })),
        {
          username: newUsername.trim(),
          level: permissionLevel,
        },
      ]

      await axios.put(`/api/agents/${agent._id}/permissions`, {
        permissions: permissionsList,
      })

      // Refetch permissions to get the updated list with proper user data
      const response = await axios.get(`/api/agents/${agent._id}/permissions`)
      setPermissions(response.data.permissions || [])

      setNewUsername('')
      toast.success(
        `${
          permissionLevel === 'editor' ? 'Editor' : 'Owner'
        } added successfully`,
        {
          richColors: true,
          dismissible: true,
        },
      )
    } catch (error) {
      const errorMessage =
        (error as AxiosError<{ error?: string }>).response?.data?.error ||
        (error as AxiosError).message ||
        `Failed to add ${permissionLevel}`
      toast.error(`Failed to add ${permissionLevel}`, {
        description: errorMessage,
        richColors: true,
        dismissible: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveUser = async (permissionToRemove: AgentPermission) => {
    if (!hasOwnerAccess) return
    if (!permissionsGate.isAllowed) {
      permissionsGate.openGate()
      return
    }
    setIsSubmitting(true)
    try {
      // Prepare the permissions list without the removed user
      const permissionsList = permissions
        .filter(p => p._id !== permissionToRemove._id)
        .map(p => ({
          username: p.user.username,
          level: p.level as AgentPermissionLevelType,
        }))

      await axios.put(`/api/agents/${agent._id}/permissions`, {
        permissions: permissionsList,
      })

      setPermissions(prev => prev.filter(p => p._id !== permissionToRemove._id))

      toast.success(
        `${
          permissionToRemove.level === AgentPermissionLevel.Editor
            ? 'Editor'
            : 'Owner'
        } removed successfully`,
        {
          richColors: true,
          dismissible: true,
        },
      )
    } catch (error) {
      toast.error('Failed to remove permission', {
        description: 'Please try again later.',
        richColors: true,
        dismissible: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const owners = permissions.filter(p => p.level === AgentPermissionLevel.Owner)
  const editors = permissions.filter(
    p => p.level === AgentPermissionLevel.Editor,
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PayerSettings agent={agent} />
      <div>
        <h2 className="text-lg font-medium mb-4">Agent Permissions</h2>
        <div className="p-6 bg-card rounded-xl border border-border">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium block mb-2">
                Add User Permission
              </label>
              <p className="text-sm text-muted-foreground mb-4">
                Grant users permission to edit or manage this agent. Owners have
                full control, while editors can only modify the profile.
              </p>
              {!hasOwnerAccess ? (
                <LockedFeatureBanner
                  gate={permissionsGate}
                  title="Only owners can manage permissions"
                  description="You need to own this agent to invite editors or owners."
                />
              ) : !permissionsGate.isAllowed ? (
                <LockedFeatureBanner
                  gate={permissionsGate}
                  title="Sharing is a subscriber feature"
                  description="Invite owners and editors with a Basic plan or higher."
                />
              ) : null}
              <div className="mb-4 p-4 bg-muted/50 rounded-lg border">
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium text-foreground mb-1 flex items-center gap-2">
                      <ShieldIcon className="w-4 h-4" />
                      Owner Permissions
                    </div>
                    <div className="text-muted-foreground ml-6">
                      Full control: Edit profile, configure tools, manage
                      integrations.
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-foreground mb-1 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Editor Permissions
                    </div>
                    <div className="text-muted-foreground ml-6">
                      Limited access: Edit profile only (name, description,
                      image, persona, greeting)
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="Enter Eden username..."
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      handleAddUser()
                    }
                  }}
                  disabled={isFormDisabled}
                  className="flex-1"
                />
                <Select
                  value={permissionLevel}
                  onValueChange={value =>
                    setPermissionLevel(value as AgentPermissionLevelType)
                  }
                  disabled={isFormDisabled}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddUser}
                  disabled={
                    isSubmitting || !newUsername.trim() || isFormDisabled
                  }
                  type="button"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Add'
                  )}
                </Button>
              </div>
            </div>

            {owners.length > 0 && (
              <div>
                <label className="text-sm font-medium block mb-2">Owners</label>
                <div className="space-y-2">
                  {owners.map(permission => (
                    <div
                      key={permission._id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {permission.user.username}
                        </span>
                        <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                          Owner
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(permission)}
                        disabled={isSubmitting || !permissionsGate.isAllowed}
                        className="hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {editors.length > 0 && (
              <div>
                <label className="text-sm font-medium block mb-2">
                  Editors
                </label>
                <div className="space-y-2">
                  {editors.map(permission => (
                    <div
                      key={permission._id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {permission.user.username}
                        </span>
                        <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                          Editor
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(permission)}
                        disabled={isSubmitting || !permissionsGate.isAllowed}
                        className="hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {permissions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No additional users have permissions for this agent. Add users
                above to grant them access.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
