'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Agent, AgentPermission, PermissionLevel } from '@edenlabs/eden-sdk'
import axios, { AxiosError } from 'axios'
import { Loader2, ShieldIcon, UserIcon, XIcon } from 'lucide-react'
import { FC, useEffect, useState } from 'react'
import { toast } from 'sonner'

type PermissionLevelType = 'editor' | 'owner'

export const PermissionsTab: FC<{ agent: Agent }> = ({ agent }) => {
  const [permissions, setPermissions] = useState<AgentPermission[]>([])
  const [newUsername, setNewUsername] = useState('')
  const [permissionLevel, setPermissionLevel] =
    useState<PermissionLevelType>('editor')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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
          level: p.level as PermissionLevelType,
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
    setIsSubmitting(true)
    try {
      // Prepare the permissions list without the removed user
      const permissionsList = permissions
        .filter(p => p._id !== permissionToRemove._id)
        .map(p => ({
          username: p.user.username,
          level: p.level as PermissionLevelType,
        }))

      await axios.put(`/api/agents/${agent._id}/permissions`, {
        permissions: permissionsList,
      })

      setPermissions(prev => prev.filter(p => p._id !== permissionToRemove._id))

      toast.success(
        `${
          permissionToRemove.level === PermissionLevel.Editor
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

  const owners = permissions.filter(p => p.level === PermissionLevel.Owner)
  const editors = permissions.filter(p => p.level === PermissionLevel.Editor)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
              <div className="mb-4 p-4 bg-muted/50 rounded-lg border">
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium text-foreground mb-1 flex items-center gap-2">
                      <ShieldIcon className="w-4 h-4" />
                      Owner Permissions
                    </div>
                    <div className="text-muted-foreground ml-6">
                      Full control: Edit profile, configure tools, manage
                      integrations, and modify permissions
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
                  disabled={isSubmitting}
                  className="flex-1"
                />
                <Select
                  value={permissionLevel}
                  onValueChange={value =>
                    setPermissionLevel(value as PermissionLevelType)
                  }
                  disabled={isSubmitting}
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
                  disabled={isSubmitting || !newUsername.trim()}
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
                <p className="text-sm text-muted-foreground mb-3">
                  Users with complete control over this agent
                </p>
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
                        disabled={isSubmitting}
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
                <p className="text-sm text-muted-foreground mb-3">
                  Users with limited editing access
                </p>
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
                        disabled={isSubmitting}
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
