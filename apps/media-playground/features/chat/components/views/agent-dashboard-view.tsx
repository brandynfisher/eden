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
  const [globalMetric, setGlobalMetric] = useState<'messages' | 'tokens'>(
    'messages',
  )

  // Date range presets - work in local timezone
  const getDateRangePreset = (preset: string) => {
    const now = new Date()

    // End date is always end of today in local timezone
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    )

    let startDate: Date

    switch (preset) {
      case 'lastWeek':
        // Last 7 days: 6 days ago through today (inclusive)
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 6)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'last4Weeks':
        // Last 28 days: 27 days ago through today (inclusive)
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 27)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'last3Months':
        // Last 90 days: 89 days ago through today (inclusive)
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 89)
        startDate.setHours(0, 0, 0, 0)
        break
      default:
        // Default to last 4 weeks
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 27)
        startDate.setHours(0, 0, 0, 0)
    }

    return { from: startDate, to: endDate }
  }

  // Default to last 4 weeks (will be overridden by smart defaulting)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    getDateRangePreset('last4Weeks'),
  )
  const [selectedPreset, setSelectedPreset] = useState<string>('last4Weeks')

  // Convert local timezone dates to YYYY-MM-DD format for API
  const formatDateForAPI = (date: Date) => {
    // Format the local date as YYYY-MM-DD without timezone conversion
    // This preserves the user-selected date regardless of timezone
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const startDate = dateRange?.from
    ? formatDateForAPI(dateRange.from)
    : undefined
  const endDate = dateRange?.to ? formatDateForAPI(dateRange.to) : undefined

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

  // Helper function to format numbers with k/M suffixes
  const formatValue = (value: number, applyFormatting = false) => {
    if (!applyFormatting) return value.toString()

    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`
    }
    return value.toString()
  }

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
      const result = dashboardData.messageActivity.map(
        (item: MessageActivityData) => {
          const value =
            globalMetric === 'tokens'
              ? item.tokenCount || 0
              : item.messageCount || 0
          const unit = globalMetric === 'tokens' ? 'tokens' : 'messages'
          const formattedValue = formatValue(value, true) // Apply k/M formatting to both messages and tokens
          return {
            date: item.date,
            platform: item.platform,
            value,
            label: `${formattedValue} ${unit}`,
          }
        },
      )

      return result
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
  }, [dashboardData, globalMetric])

  // Pie chart data for user message distribution
  const pieChartData = useMemo(() => {
    if (!dashboardData?.userStats || dashboardData.userStats.length === 0) {
      return []
    }

    const result = dashboardData.userStats
      .map((user: UserStatsData) => {
        const value =
          globalMetric === 'tokens'
            ? user.tokenCount || 0
            : user.messageCount || 0
        return {
          label: user.username || 'Unknown',
          value,
          formattedValue: formatValue(value, true), // Apply k/M formatting to both
        }
      })
      .sort((a, b) => b.value - a.value)

    return result
  }, [dashboardData, globalMetric])

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
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Date Range Presets */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePresetClick('lastWeek')}
                className={`h-12 px-3 py-2 text-xs rounded-md transition-colors ${
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
                className={`h-12 px-3 py-2 text-xs rounded-md transition-colors ${
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
                className={`h-12 px-3 py-2 text-xs rounded-md transition-colors ${
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
                {globalMetric === 'tokens'
                  ? 'Token Activity'
                  : 'Message Activity'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {globalMetric === 'tokens'
                  ? 'Tokens across all conversations'
                  : 'Messages across all conversations'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Metric toggle for bar chart */}
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium">Show:</span>
                <div className="relative inline-flex items-center bg-muted rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setGlobalMetric('messages')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                      globalMetric === 'messages'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Messages
                  </button>
                  <button
                    type="button"
                    onClick={() => setGlobalMetric('tokens')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                      globalMetric === 'tokens'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Tokens
                  </button>
                </div>
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
                  User {globalMetric === 'tokens' ? 'Token' : 'Message'}{' '}
                  Distribution
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Top contributors by user{' '}
                  {globalMetric === 'tokens' ? 'token' : 'message'} count
                  (excluding agent/system messages)
                </p>
              </div>

              {/* Metric toggle for pie chart */}
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium">Show:</span>
                <div className="relative inline-flex items-center bg-muted rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setGlobalMetric('messages')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                      globalMetric === 'messages'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Messages
                  </button>
                  <button
                    type="button"
                    onClick={() => setGlobalMetric('tokens')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                      globalMetric === 'tokens'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Tokens
                  </button>
                </div>
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
                  valueLabel={globalMetric === 'tokens' ? 'tokens' : 'messages'}
                  className="mx-auto"
                />
              </div>

              <div className="flex-1 min-w-0 lg:min-h-[300px]">
                <h3 className="text-lg font-medium mb-4">Contributors</h3>
                <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2">
                  {pieChartData.map(
                    (
                      user: {
                        label: string
                        value: number
                        formattedValue?: string
                      },
                      index: number,
                    ) => {
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
                                  '#1f77b4b3',
                                  '#ff7f0eb3',
                                  '#2ca02cb3',
                                  '#d62728b3',
                                  '#9467bdb3',
                                  '#8c564bb3',
                                  '#e377c2b3',
                                  '#7f7f7fb3',
                                  '#bcbd22b3',
                                  '#17becfb3',
                                  '#aec7e8b3',
                                  '#ffbb78b3',
                                  '#98df8ab3',
                                  '#ff9896b3',
                                  '#c5b0d5b3',
                                  '#c49c94b3',
                                  '#f7b6d3b3',
                                  '#c7c7c7b3',
                                  '#dbdb8db3',
                                  '#9edae5b3',
                                ][index % 20],
                              }}
                            />
                            <a
                              href={`/creators/${user.label}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium truncate text-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors cursor-pointer"
                            >
                              {user.label}
                            </a>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-shrink-0">
                            <span>
                              {user.formattedValue ||
                                formatValue(user.value, true)}{' '}
                              {globalMetric === 'tokens'
                                ? 'tokens'
                                : 'messages'}
                            </span>
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
