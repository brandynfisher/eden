'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Settings } from 'lucide-react'
import React from 'react'

export function UserPreferences() {
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
        {/* Temporarily hidden - Agent Spend Threshold */}
        {/* <div className="space-y-2">
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
        </Button> */}
      </CardContent>
    </Card>
  )
}
