'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { Creator } from '@edenlabs/eden-sdk'
import { Settings } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function UserPreferences() {
  const { user, refetchMe } = useAuthState()

  const [agentSpendThreshold, setAgentSpendThreshold] = useState<string>('50')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Set initial value from user data
  useEffect(() => {
    if (user?.preferences?.agent_spend_threshold !== undefined) {
      setAgentSpendThreshold(user.preferences.agent_spend_threshold.toString())
    } else if (user) {
      // Default to 50 for existing users without preferences
      setAgentSpendThreshold('50')
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return

    const thresholdValue = parseInt(agentSpendThreshold, 10)

    if (isNaN(thresholdValue) || thresholdValue < 0) {
      toast.error('Invalid threshold', {
        description: 'Please enter a valid positive number.',
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/creators/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: {
            agent_spend_threshold: thresholdValue,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update preferences')
      }

      await refetchMe()

      toast.success('Preferences updated', {
        description:
          'Your agent spend threshold has been updated successfully.',
      })
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Error', {
        description: 'Failed to update preferences. Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAgentSpendThreshold(e.target.value)
  }

  if (isLoading) {
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
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-10 w-full max-w-xs" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <Skeleton className="h-10 w-[100px]" />
        </CardContent>
      </Card>
    )
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
        <div className="space-y-2">
          <Label htmlFor="agent-spend-threshold">
            Agent Spend Threshold (Manna)
          </Label>
          <Input
            id="agent-spend-threshold"
            type="number"
            min="0"
            value={agentSpendThreshold}
            onChange={handleInputChange}
            className="max-w-xs"
            placeholder="50"
          />
          <p className="text-sm text-muted-foreground">
            Agents will ask for confirmation before spending more than this
            amount of manna on a single task.
          </p>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-fit">
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardContent>
    </Card>
  )
}
