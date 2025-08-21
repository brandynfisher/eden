'use client'

import BarChart from '@/components/ui/bar-chart'
import { Checkbox } from '@/components/ui/checkbox'
import DateRangePicker from '@/components/ui/date-range-picker'
import { useAgentDashboardQuery } from '@/hooks/query/use-agent-dashboard-query'
import { Agent } from '@edenlabs/eden-sdk'
import { Loader2 } from 'lucide-react'
import { FC, useMemo, useState } from 'react'
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

  const chartData = useMemo(() => {
    if (!dashboardData?.sessionActivity) {
      return []
    }

    const transformed = dashboardData.sessionActivity.map(item => ({
      date: item.date,
      platform: item.platform,
      value: item.totalUserMessages,
      label: `${item.totalUserMessages} messages`,
    }))

    return transformed
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

        {/* Session Activity Chart */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Session Activity
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                User messages per day across all sessions
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
                  Total messages:{' '}
                  {dashboardData.sessionActivity.reduce(
                    (sum, item) => sum + item.totalUserMessages,
                    0,
                  )}
                </span>
                <span>
                  Active days:{' '}
                  {
                    dashboardData.sessionActivity.filter(
                      item => item.totalUserMessages > 0,
                    ).length
                  }
                </span>
                <span>Platforms: {dashboardData.platforms.join(', ')}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AgentDashboardView
