'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useUserTriggersQuery } from '@/hooks/query/use-user-triggers-query'
import { useMe } from '@/hooks/use-me'
import { formatCronSchedule } from '@/lib/format-cron-schedule'
import { useAuth } from '@clerk/nextjs'
import { FeatureFlag } from '@edenlabs/eden-sdk'
import { AlertCircle, Calendar, Clock, Eye, Filter, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

const TasksPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const { user } = useMe({
    isAuthenticated: !!isSignedIn,
  })

  const isPreviewUser = user?.featureFlags?.includes(FeatureFlag.Preview)

  const { triggers, isPending, isError, error } = useUserTriggersQuery()

  const formatLastRunTime = (lastRunTime?: Date) => {
    if (!lastRunTime) return 'Never'

    const date = new Date(lastRunTime)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays}d ago`
    } else if (diffHours > 0) {
      return `${diffHours}h ago`
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      if (diffMinutes > 0) {
        return `${diffMinutes}m ago`
      } else {
        return 'Just now'
      }
    }
  }

  const filteredTriggers = useMemo(() => {
    const filtered = triggers.filter(trigger => {
      const matchesSearch = (trigger.prompt || trigger.name || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      const matchesStatus =
        !statusFilter ||
        statusFilter === 'all' ||
        trigger.status === statusFilter

      return matchesSearch && matchesStatus
    })

    // Sort by next_scheduled_run (most recent/earliest first)
    return filtered.sort((a, b) => {
      // If neither has next_scheduled_run, fall back to createdAt
      if (!a.next_scheduled_run && !b.next_scheduled_run) {
        const aDate = new Date(a.createdAt)
        const bDate = new Date(b.createdAt)
        return bDate.getTime() - aDate.getTime()
      }

      // If only a has no next_scheduled_run, put it last
      if (!a.next_scheduled_run) return 1
      // If only b has no next_scheduled_run, put it last
      if (!b.next_scheduled_run) return -1

      // Both have next_scheduled_run, sort by earliest first (ascending)
      const aNextRun = new Date(a.next_scheduled_run).getTime()
      const bNextRun = new Date(b.next_scheduled_run).getTime()
      return aNextRun - bNextRun
    })
  }, [triggers, searchTerm, statusFilter])

  if (isPending) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Tasks</h2>
          <p className="text-muted-foreground">
            Manage all your scheduled tasks across agents
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If user doesn't have preview flag, show access denied
  if (!isPreviewUser) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Deployments</h2>
          <p className="text-muted-foreground">
            Manage all your agent deployments across platforms
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <p>This feature is not available for your account.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Tasks</h2>
          <p className="text-muted-foreground">
            Manage all your scheduled tasks across agents
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load tasks: {error?.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[100vw] px-2">
      <div>
        <h2 className="text-2xl font-bold">Tasks</h2>
        <p className="text-muted-foreground">
          Manage all your scheduled tasks across agents
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2 lg:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search tasks or agents..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            All Tasks ({filteredTriggers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Task</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="min-w-[120px]">Schedule</TableHead>
                  <TableHead className="min-w-[100px]">Last Run</TableHead>
                  <TableHead className="min-w-[80px]">Created</TableHead>
                  <TableHead className="min-w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTriggers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No tasks found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTriggers.map(trigger => (
                    <TableRow key={trigger._id}>
                      <TableCell className="p-4">
                        <div className="max-w-[250px]">
                          <div className="font-medium text-sm truncate">
                            {trigger.name || trigger.prompt}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <Badge
                          variant={
                            trigger.status === 'active'
                              ? 'default'
                              : 'secondary'
                          }
                          className="capitalize whitespace-nowrap"
                        >
                          {trigger.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {formatCronSchedule(trigger.schedule)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatLastRunTime(trigger.last_run_time)}
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(trigger.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="flex items-center gap-2">
                          {trigger.session && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const sessionId =
                                  typeof trigger.session === 'string'
                                    ? trigger.session
                                    : trigger.session._id
                                router.push(`/sessions/${sessionId}`)
                              }}
                              className="h-8 w-8 p-0"
                              title="View session"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TasksPage
