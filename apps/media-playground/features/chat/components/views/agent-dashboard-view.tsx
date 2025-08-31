'use client'

import BarChart from '@/components/ui/bar-chart'
import { Checkbox } from '@/components/ui/checkbox'
import DateRangePicker from '@/components/ui/date-range-picker'
import PieChart from '@/components/ui/pie-chart'
import {
  MessageActivityData,
  MessageDataItem,
  UserStatsData,
  useAgentDashboardQuery,
} from '@/hooks/query/use-agent-dashboard-query'
import { Agent } from '@edenlabs/eden-sdk'
import { Loader2 } from 'lucide-react'
import React, { FC, useMemo, useState } from 'react'
import { DateRange } from 'react-day-picker'

interface AgentDashboardViewProps {
  agent: Agent
}

const AgentDashboardView: FC<AgentDashboardViewProps> = ({ agent }) => {
  // Default to last 7 days
  const defaultEndDate = new Date()
  const defaultStartDate = new Date(
    defaultEndDate.getTime() - 7 * 24 * 60 * 60 * 1000,
  )

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: defaultStartDate,
    to: defaultEndDate,
  })
  const [showPlatformColors, setShowPlatformColors] = useState(true)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([
    'user',
    'assistant',
  ])

  const startDate = dateRange?.from?.toISOString().split('T')[0]
  const endDate = dateRange?.to?.toISOString().split('T')[0]

  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
  } = useAgentDashboardQuery({
    agentId: agent._id,
    startDate,
    endDate,
  })

  // Debug logs for dashboard data
  React.useEffect(() => {
    console.log('[Frontend Dashboard] Query state:', {
      isLoading,
      isError,
      error,
    })
    console.log('[Frontend Dashboard] Agent ID:', agent._id)
    console.log('[Frontend Dashboard] Date range:', { startDate, endDate })

    if (dashboardData) {
      console.log('[Frontend Dashboard] Received dashboardData:', {
        messageActivity: dashboardData.messageActivity.length || 0,
        userStats: dashboardData.userStats.length || 0,
        messageDataList: dashboardData.messageDataList.length || 0,
        platforms: dashboardData.platforms,
        roles: dashboardData.roles,
      })
      console.log(
        '[Frontend Dashboard] Sample messageDataList:',
        dashboardData.messageDataList.slice(0, 3),
      )
      console.log(
        '[Frontend Dashboard] Sample messageActivity:',
        dashboardData.messageActivity.slice(0, 3),
      )
      console.log(
        '[Frontend Dashboard] Sample userStats:',
        dashboardData.userStats.slice(0, 3),
      )
    } else {
      console.log('[Frontend Dashboard] dashboardData is null/undefined')
    }
  }, [dashboardData, isLoading, isError, error, agent._id, startDate, endDate])

  // Chart data for bar chart (use messageActivity from backend)
  const chartData = useMemo(() => {
    console.log('[Frontend Dashboard] Computing chartData...')
    console.log(
      '[Frontend Dashboard] dashboardData?.messageActivity length:',
      dashboardData?.messageActivity.length,
    )
    console.log(
      '[Frontend Dashboard] dashboardData?.messageDataList length:',
      dashboardData?.messageDataList.length,
    )
    console.log('[Frontend Dashboard] selectedRoles:', selectedRoles)

    // Use messageActivity if available (new format), fallback to messageDataList processing
    if (dashboardData?.messageActivity) {
      console.log('[Frontend Dashboard] Using messageActivity data')
      const result = dashboardData.messageActivity.map(
        (item: MessageActivityData) => ({
          date: item.date,
          platform: item.platform,
          value: item.messageCount,
          label: `${item.messageCount} messages`,
        }),
      )
      console.log(
        '[Frontend Dashboard] Final chartData from messageActivity:',
        result.slice(0, 5),
      )
      return result
    }

    // Fallback to messageDataList processing (if messageActivity not available)
    if (!dashboardData?.messageDataList) {
      console.log(
        '[Frontend Dashboard] No messageActivity or messageDataList, returning empty chartData',
      )
      return []
    }

    console.log(
      '[Frontend Dashboard] Fallback: using messageDataList processing',
    )
    const filtered = dashboardData.messageDataList.filter(
      (msg: MessageDataItem) => selectedRoles.includes(msg.role),
    )
    console.log(
      '[Frontend Dashboard] Filtered messages count:',
      filtered.length,
    )

    // Group by date and platform
    const grouped = new Map()
    filtered.forEach((msg: MessageDataItem) => {
      const key = `${msg.date}-${msg.platform}`
      if (!grouped.has(key)) {
        grouped.set(key, { date: msg.date, platform: msg.platform, count: 0 })
      }
      grouped.get(key).count += 1
    })

    const result = Array.from(grouped.values()).map(
      (item: { date: string; platform: string; count: number }) => ({
        date: item.date,
        platform: item.platform,
        value: item.count,
        label: `${item.count} messages`,
      }),
    )

    console.log(
      '[Frontend Dashboard] Final chartData from messageDataList:',
      result.slice(0, 5),
    )
    return result
  }, [dashboardData, selectedRoles])

  // Pie chart data for user message distribution
  const pieChartData = useMemo(() => {
    console.log('[Frontend Dashboard] Computing pieChartData...')
    console.log(
      '[Frontend Dashboard] dashboardData?.userStats length:',
      dashboardData?.userStats.length,
    )

    // Use userStats if available (new format)
    if (dashboardData?.userStats && dashboardData.userStats.length > 0) {
      console.log('[Frontend Dashboard] Using userStats data for pie chart')
      const result = dashboardData.userStats.map((user: UserStatsData) => ({
        label: user.username,
        value: user.messageCount,
      }))
      console.log(
        '[Frontend Dashboard] Final pieChartData from userStats:',
        result,
      )
      return result
    }

    // Fallback to messageDataList processing
    if (!dashboardData?.messageDataList) {
      console.log(
        '[Frontend Dashboard] No userStats or messageDataList for pie chart',
      )
      return []
    }

    console.log(
      '[Frontend Dashboard] Fallback: using messageDataList for pie chart',
    )
    const filtered = dashboardData.messageDataList.filter(
      (msg: MessageDataItem) => selectedRoles.includes(msg.role),
    )
    console.log(
      '[Frontend Dashboard] Pie chart filtered messages:',
      filtered.length,
    )

    const userCounts = new Map()
    filtered.forEach((msg: MessageDataItem) => {
      userCounts.set(msg.username, (userCounts.get(msg.username) || 0) + 1)
    })

    const result = Array.from(userCounts.entries())
      .map(([username, count]: [string, number]) => ({
        label: username,
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 users

    console.log(
      '[Frontend Dashboard] Final pieChartData from messageDataList:',
      result,
    )
    return result
  }, [dashboardData, selectedRoles])

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role],
    )
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
  }

  if (isError) {
    return (
      <div className="flex-1 overflow-auto bg-accent p-3 md:p-4">
        <div className="mx-auto max-w-5xl">
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <span className="font-medium">
                Error loading dashboard data:{' '}
                {(error as Error)?.message || 'Unknown error'}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto bg-accent p-3 md:p-4">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {agent.name} Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Activity overview and performance metrics
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        {/* Message Activity Chart */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Message Activity
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Messages by actual send date across all conversations
              </p>
            </div>

            {/* Platform colors toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="platform-colors"
                checked={showPlatformColors}
                onCheckedChange={checked =>
                  setShowPlatformColors(checked as boolean)
                }
              />
              <label
                htmlFor="platform-colors"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Color by platform
              </label>
            </div>
          </div>

          {/* Role filters */}
          {dashboardData?.roles && dashboardData.roles.length > 0 && (
            <div className="mb-4 p-3 bg-muted/50 rounded-md">
              <p className="text-sm font-medium mb-2">Filter by Role:</p>
              <div className="flex flex-wrap gap-2">
                {dashboardData.roles.map((role: string) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={() => handleRoleToggle(role)}
                    />
                    <label
                      htmlFor={`role-${role}`}
                      className="text-sm capitalize cursor-pointer"
                    >
                      {role}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading activity data...</span>
              </div>
            </div>
          ) : (
            <BarChart
              data={chartData}
              height={300}
              showPlatformColors={showPlatformColors}
              className="w-full"
            />
          )}

          {dashboardData && (
            <div className="mt-4 text-sm text-muted-foreground">
              <div className="flex flex-wrap gap-4">
                <span>
                  Total messages:{' '}
                  {dashboardData.messageDataList.filter(
                    (msg: MessageDataItem) => selectedRoles.includes(msg.role),
                  ).length || 0}
                </span>
                <span>
                  Active days:{' '}
                  {
                    chartData.filter(
                      (item: { value: number }) => item.value > 0,
                    ).length
                  }
                </span>
                <span>Platforms: {dashboardData.platforms.join(', ')}</span>
              </div>
            </div>
          )}
        </div>

        {/* User Message Distribution */}
        {(dashboardData?.userStats || dashboardData?.messageDataList) && (
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  User Message Distribution
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Top contributors by message count
                </p>
              </div>
            </div>

            <div className="flex items-start gap-8">
              <PieChart
                data={pieChartData}
                width={300}
                height={300}
                showLabels={true}
                showValues={true}
                className="flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium mb-4">Top Contributors</h3>
                <div className="space-y-2">
                  {pieChartData
                    .slice(0, 5)
                    .map(
                      (
                        user: { label: string; value: number },
                        index: number,
                      ) => (
                        <div
                          key={user.label}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm font-medium">
                            #{index + 1} {user.label}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {user.value} messages
                          </span>
                        </div>
                      ),
                    )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AgentDashboardView
