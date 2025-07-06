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
import UserAvatar from '@/components/user/user-avatar'
import { useUserTriggersQuery } from '@/hooks/query/use-user-triggers-query'
import { formatCronSchedule } from '@/lib/format-cron-schedule'
import {
  AlertCircle,
  Calendar,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Search,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

const TasksPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [agentFilter, setAgentFilter] = useState<string>('')
  const router = useRouter()

  const { triggers, isPending, isError, error } = useUserTriggersQuery()

  const uniqueAgents = useMemo(() => {
    const agents = triggers.map(trigger => trigger.agent)
    const unique = agents.filter(
      (agent, index, self) =>
        index === self.findIndex(a => a._id === agent._id),
    )
    return unique
  }, [triggers])

  const filteredTriggers = useMemo(() => {
    return triggers.filter(trigger => {
      const matchesSearch =
        trigger.instruction.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trigger.agent.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus =
        !statusFilter ||
        statusFilter === 'all' ||
        trigger.status === statusFilter
      const matchesAgent =
        !agentFilter ||
        agentFilter === 'all' ||
        trigger.agent._id === agentFilter

      return matchesSearch && matchesStatus && matchesAgent
    })
  }, [triggers, searchTerm, statusFilter, agentFilter])

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
    <div className="space-y-6">
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
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
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
            <div className="min-w-[150px]">
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
            <div className="min-w-[150px]">
              <Label>Agent</Label>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All agents</SelectItem>
                  {uniqueAgents.map(agent => (
                    <SelectItem key={agent._id} value={agent._id}>
                      {agent.name}
                    </SelectItem>
                  ))}
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
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
                    <TableCell>
                      <div className="max-w-sm">
                        <div className="font-medium text-sm truncate">
                          {trigger.instruction}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCronSchedule(trigger.schedule)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          image={trigger.agent.userImage}
                          name={trigger.agent.name}
                          className="h-6 w-6"
                        />
                        <Link
                          href={`/agents/${trigger.agent.username}`}
                          className="text-sm hover:underline"
                        >
                          {trigger.agent.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          trigger.status === 'active' ? 'default' : 'secondary'
                        }
                        className="capitalize"
                      >
                        {trigger.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatCronSchedule(trigger.schedule)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(trigger.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/chat/${trigger.agent.username}?tab=tasks`,
                            )
                          }
                          className="h-8 w-8 p-0"
                          title="Manage task"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        {trigger.session && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/sessions/${trigger.session}`)
                            }
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
        </CardContent>
      </Card>
    </div>
  )
}

export default TasksPage
