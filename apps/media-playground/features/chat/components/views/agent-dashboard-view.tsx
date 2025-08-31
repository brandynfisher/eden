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
  const [showPlatformColors, setShowPlatformColors] = useState(true)

  // Date range presets
  const getDateRangePreset = (preset: string) => {
    const endDate = new Date()
    let startDate: Date

    switch (preset) {
      case 'lastWeek':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'last4Weeks':
        startDate = new Date(endDate.getTime() - 28 * 24 * 60 * 60 * 1000)
        break
      case 'last3Months':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(endDate.getTime() - 28 * 24 * 60 * 60 * 1000)
    }

    return { from: startDate, to: endDate }
  }

  // Default to last 4 weeks (will be overridden by smart defaulting)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    getDateRangePreset('last4Weeks'),
  )
  const [selectedPreset, setSelectedPreset] = useState<string>('last4Weeks')

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

  // Smart defaulting: adjust date range based on backend-calculated activity metadata (performance optimized)
  React.useEffect(() => {
    if (dashboardData?.activityMetadata && selectedPreset === 'last4Weeks') {
      // Use backend-calculated metadata instead of expensive frontend processing
      if (
        dashboardData.activityMetadata.hasRecentActivityOnly &&
        dashboardData.activityMetadata.totalMessages > 0
      ) {
        const lastWeekRange = getDateRangePreset('lastWeek')
        setDateRange(lastWeekRange)
        setSelectedPreset('lastWeek')
      }
    }
  }, [dashboardData?.activityMetadata, selectedPreset])

  // Chart data for bar chart (use messageActivity from backend)
  const chartData = useMemo(() => {
    if (!dashboardData) {
      return []
    }

    // Use messageActivity if available (new format)
    if (
      dashboardData.messageActivity &&
      dashboardData.messageActivity.length > 0
    ) {
      return dashboardData.messageActivity.map((item: MessageActivityData) => ({
        date: item.date,
        platform: item.platform,
        value: item.messageCount || 0,
        label: `${item.messageCount || 0} messages`,
      }))
    }

    // Fallback to sessionActivity (backward compatibility)
    if (
      dashboardData.sessionActivity &&
      dashboardData.sessionActivity.length > 0
    ) {
      return dashboardData.sessionActivity.map((item: SessionActivityData) => ({
        date: item.date,
        platform: item.platform,
        value: item.totalUserMessages || 0,
        label: `${item.totalUserMessages || 0} messages`,
      }))
    }

    return []
  }, [dashboardData])

  // Pie chart data for user message distribution
  const pieChartData = useMemo(() => {
    if (!dashboardData?.userStats || dashboardData.userStats.length === 0) {
      return []
    }

    return dashboardData.userStats
      .map((user: UserStatsData) => ({
        label: user.username || 'Unknown',
        value: user.messageCount || 0,
      }))
      .sort((a, b) => b.value - a.value)
  }, [dashboardData])

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    setSelectedPreset('') // Clear preset when manually changing date
  }

  const handlePresetClick = (preset: string) => {
    const range = getDateRangePreset(preset)
    setDateRange(range)
    setSelectedPreset(preset)
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
            {/* Date Range Presets */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePresetClick('lastWeek')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedPreset === 'lastWeek'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Last Week
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('last4Weeks')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedPreset === 'last4Weeks'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Last 4 Weeks
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('last3Months')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedPreset === 'last3Months'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Last 3 Months
              </button>
            </div>
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
                Messages across all conversations
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
        </div>

        {/* User Message Distribution */}
        {dashboardData?.userStats && (
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  User Message Distribution
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Top contributors by user message count (excluding agent/system
                  messages)
                </p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-start gap-8">
              <div className="flex-shrink-0">
                <PieChart
                  data={pieChartData}
                  width={300}
                  height={300}
                  showLabels={false}
                  showValues={false}
                  className="mx-auto"
                />
              </div>

              <div className="flex-1 min-w-0 lg:min-h-[300px]">
                <h3 className="text-lg font-medium mb-4">Contributors</h3>
                <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2">
                  {pieChartData.map(
                    (user: { label: string; value: number }, index: number) => {
                      const total = pieChartData.reduce(
                        (sum, item) => sum + item.value,
                        0,
                      )
                      const percentage =
                        total > 0
                          ? ((user.value / total) * 100).toFixed(1)
                          : '0.0'

                      return (
                        <div
                          key={user.label}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="w-3 h-3 rounded-sm flex-shrink-0"
                              style={{
                                backgroundColor: [
                                  '#3b82f6',
                                  '#ef4444',
                                  '#22c55e',
                                  '#f59e0b',
                                  '#8b5cf6',
                                  '#ec4899',
                                  '#06b6d4',
                                  '#84cc16',
                                  '#f97316',
                                  '#6366f1',
                                ][index % 10],
                              }}
                            />
                            <span className="text-sm font-medium truncate">
                              {user.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-shrink-0">
                            <span>{user.value} messages</span>
                            <span className="text-xs bg-background px-2 py-1 rounded">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      )
                    },
                  )}
                </div>
                {pieChartData.length > 10 && (
                  <div className="mt-3 text-xs text-muted-foreground text-center">
                    Showing all {pieChartData.length} contributors • Scroll to
                    see more
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AgentDashboardView
