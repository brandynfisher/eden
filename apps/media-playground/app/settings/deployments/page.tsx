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
import { useUserDeploymentsQuery } from '@/hooks/query/use-user-deployments-query'
import { useMe } from '@/hooks/use-me'
import { useAuth } from '@clerk/nextjs'
import { FeatureFlag } from '@edenlabs/eden-sdk'
import {
  Activity,
  AlertCircle,
  ExternalLink,
  Filter,
  Globe,
  MessageCircle,
  Search,
  Twitter,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

const DeploymentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [platformFilter, setPlatformFilter] = useState<string>('')
  const [agentFilter, setAgentFilter] = useState<string>('')
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const { user } = useMe({
    isAuthenticated: !!isSignedIn,
  })

  const isPreviewUser = user?.featureFlags?.includes(FeatureFlag.Preview)

  const { deployments, isPending, isError, error } = useUserDeploymentsQuery()

  const uniqueAgents = useMemo(() => {
    const agents = deployments.map(deployment => deployment.agent)
    const unique = agents.filter(
      (agent, index, self) =>
        index === self.findIndex(a => a._id === agent._id),
    )
    return unique
  }, [deployments])

  const uniquePlatforms = useMemo(() => {
    const platforms = [...new Set(deployments.map(d => d.platform))]
    return platforms
  }, [deployments])

  const filteredDeployments = useMemo(() => {
    return deployments.filter(deployment => {
      const matchesSearch =
        deployment.agent.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        deployment.platform.toLowerCase().includes(searchTerm.toLowerCase())
      // Use deployment.valid property instead of status
      const deploymentStatus =
        deployment.valid === true
          ? 'active'
          : deployment.valid === false
          ? 'inactive'
          : 'unknown'
      const matchesStatus =
        !statusFilter ||
        statusFilter === 'all' ||
        deploymentStatus === statusFilter
      const matchesPlatform =
        !platformFilter ||
        platformFilter === 'all' ||
        deployment.platform === platformFilter
      const matchesAgent =
        !agentFilter ||
        agentFilter === 'all' ||
        deployment.agent._id === agentFilter

      return matchesSearch && matchesStatus && matchesPlatform && matchesAgent
    })
  }, [deployments, searchTerm, statusFilter, platformFilter, agentFilter])

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'discord':
        return <MessageCircle className="h-4 w-4" />
      case 'twitter':
        return <Twitter className="h-4 w-4" />
      case 'telegram':
        return <MessageCircle className="h-4 w-4" />
      case 'farcaster':
        return <Globe className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'running':
        return 'default'
      case 'stopped':
      case 'inactive':
        return 'secondary'
      case 'error':
      case 'failed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getDeploymentStatus = (deployment: { valid?: boolean }) => {
    return deployment.valid === true
      ? 'active'
      : deployment.valid === false
      ? 'inactive'
      : 'unknown'
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

  if (isPending) {
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
          <h2 className="text-2xl font-bold">Deployments</h2>
          <p className="text-muted-foreground">
            Manage all your agent deployments across platforms
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load deployments: {error?.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Deployments</h2>
        <p className="text-muted-foreground">
          Manage all your agent deployments across platforms
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
            <div className="sm:col-span-2 lg:col-span-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search agents or platforms..."
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
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Platform</Label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All platforms</SelectItem>
                  {uniquePlatforms.map(platform => (
                    <SelectItem key={platform} value={platform}>
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(platform)}
                        <span className="capitalize">{platform}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
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
            <Activity className="h-5 w-5" />
            All Deployments ({filteredDeployments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Platform</TableHead>
                  <TableHead className="min-w-[120px]">Agent</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="min-w-[100px]">Configuration</TableHead>
                  <TableHead className="min-w-[80px]">Created</TableHead>
                  <TableHead className="min-w-[80px]">Updated</TableHead>
                  <TableHead className="min-w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeployments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No deployments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeployments.map(deployment => (
                    <TableRow key={deployment._id}>
                      <TableCell className="p-4">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          {getPlatformIcon(deployment.platform)}
                          <span className="font-medium capitalize">
                            {deployment.platform}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <UserAvatar
                            image={deployment.agent.userImage}
                            name={deployment.agent.name}
                            className="h-6 w-6 flex-shrink-0"
                          />
                          <Link
                            href={`/agents/${deployment.agent.username}`}
                            className="text-sm hover:underline truncate"
                          >
                            {deployment.agent.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <Badge
                          variant={getStatusVariant(
                            getDeploymentStatus(deployment),
                          )}
                          className="capitalize whitespace-nowrap"
                        >
                          {getDeploymentStatus(deployment)}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          {deployment.config &&
                          Object.keys(deployment.config).length > 0 ? (
                            <span>
                              {Object.keys(deployment.config).length} settings
                            </span>
                          ) : (
                            <span>Default</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(deployment.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(deployment.updatedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/chat/${deployment.agent.username}?page=settings&tab=deployments`,
                              )
                            }
                            className="h-8 w-8 p-0"
                            title="Manage deployment"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
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

export default DeploymentsPage
