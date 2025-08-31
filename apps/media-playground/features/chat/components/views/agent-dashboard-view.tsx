'use client'

import BarChart from '@/components/ui/bar-chart'
import { Checkbox } from '@/components/ui/checkbox'
import DateRangePicker from '@/components/ui/date-range-picker'
import PieChart from '@/components/ui/pie-chart'
import {
  MessageActivityData,
  SessionActivityData,
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
        messageActivity: dashboardData.messageActivity?.length || 0,
        userStats: dashboardData.userStats?.length || 0,
        messageDataList: dashboardData.messageDataList?.length || 0,
        platforms: dashboardData.platforms,
        roles: dashboardData.roles,
      })
      console.log(
        '[Frontend Dashboard] Sample messageDataList:',
        dashboardData.messageDataList?.slice(0, 3),
      )
      console.log(
        '[Frontend Dashboard] Sample messageActivity:',
        dashboardData.messageActivity?.slice(0, 3),
      )
      console.log(
        '[Frontend Dashboard] Sample userStats:',
        dashboardData.userStats?.slice(0, 3),
      )
      console.log(
        '[Frontend Dashboard] Full response keys:',
        Object.keys(dashboardData),
      )
      console.log('[Frontend Dashboard] Full response:', dashboardData)
    } else {
      console.log('[Frontend Dashboard] dashboardData is null/undefined')
    }
  }, [dashboardData, isLoading, isError, error, agent._id, startDate, endDate])

  // Chart data for bar chart (use messageActivity from backend)
  const chartData = useMemo(() => {
    console.log('[Frontend Dashboard] Computing chartData...')
    console.log('[Frontend Dashboard] dashboardData:', dashboardData)

    if (!dashboardData) {
      console.log(
        '[Frontend Dashboard] No dashboardData, returning empty array',
      )
      return []
    }

    // Use messageActivity if available (new format)
    if (
      dashboardData.messageActivity &&
      dashboardData.messageActivity.length > 0
    ) {
      console.log(
        '[Frontend Dashboard] Using messageActivity data',
        dashboardData.messageActivity.length,
      )
      const result = dashboardData.messageActivity.map(
        (item: MessageActivityData) => ({
          date: item.date,
          platform: item.platform,
          value: item.messageCount || 0,
          label: `${item.messageCount || 0} messages`,
        }),
      )
      console.log(
        '[Frontend Dashboard] Final chartData from messageActivity:',
        result.slice(0, 3),
      )
      return result
    }

    // Fallback to sessionActivity (backward compatibility)
    if (
      dashboardData.sessionActivity &&
      dashboardData.sessionActivity.length > 0
    ) {
      console.log(
        '[Frontend Dashboard] Using sessionActivity fallback',
        dashboardData.sessionActivity.length,
      )
      const result = dashboardData.sessionActivity.map(
        (item: SessionActivityData) => ({
          date: item.date,
          platform: item.platform,
          value: item.totalUserMessages || 0,
          label: `${item.totalUserMessages || 0} messages`,
        }),
      )
      console.log(
        '[Frontend Dashboard] Final chartData from sessionActivity:',
        result.slice(0, 3),
      )
      return result
    }

    console.log(
      '[Frontend Dashboard] No valid data found, returning empty array',
    )
    return []
  }, [dashboardData])

  // Pie chart data for user message distribution
  const pieChartData = useMemo(() => {
    console.log('[Frontend Dashboard] Computing pieChartData...')

    if (!dashboardData) {
      console.log('[Frontend Dashboard] No dashboardData for pie chart')
      return []
    }

    // Use userStats if available (new format)
    if (dashboardData.userStats && dashboardData.userStats.length > 0) {
      console.log(
        '[Frontend Dashboard] Using userStats data for pie chart',
        dashboardData.userStats.length,
      )
      const result = dashboardData.userStats.map((user: UserStatsData) => ({
        label: user.username || 'Unknown',
        value: user.messageCount || 0,
      }))
      console.log(
        '[Frontend Dashboard] Final pieChartData from userStats:',
        result.slice(0, 3),
      )
      return result
    }

    console.log(
      '[Frontend Dashboard] No userStats available, returning empty pie chart',
    )
    return []
  }, [dashboardData])

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
                  Total messages: {dashboardData.messageDataList?.length || 0}
                </span>
                <span>
                  Active days:{' '}
                  {
                    chartData.filter(
                      (item: { value: number }) => item.value > 0,
                    ).length
                  }
                </span>
                <span>
                  Platforms: {dashboardData.platforms?.join(', ') || 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Raw Data Debug Section */}
        {dashboardData?.messageDataList && (
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Raw Message Data (Debug)
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Raw query results showing platform, role, username, timestamp
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Total messages: {dashboardData.messageDataList.length}
              </div>
              <textarea
                readOnly
                value={JSON.stringify(dashboardData.messageDataList, null, 2)}
                className="w-full h-96 p-4 bg-muted rounded-md font-mono text-xs border resize-vertical"
              />
            </div>
          </div>
        )}

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
