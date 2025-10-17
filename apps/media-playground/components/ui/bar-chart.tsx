'use client'

import { cn } from '@/lib/utils'
import { FC, useMemo } from 'react'

interface BarChartProps {
  data: Array<{
    date: string
    platform: string
    value: number
    label?: string
  }>
  height?: number
  className?: string
  showPlatformColors?: boolean
}

const PLATFORM_COLORS: Record<string, string> = {
  web: 'hsl(271, 82%, 50%)', // Primary purple - slightly brighter for visibility
  discord: 'hsl(255, 91%, 76%)', // Discord's signature purple
  telegram: 'hsl(200, 82%, 56%)', // Telegram blue
  twitter: 'hsl(204, 88%, 53%)', // Twitter blue
  api: 'hsl(240, 73%, 65%)', // Blue-purple for API
  whatsapp: 'hsl(142, 70%, 49%)', // WhatsApp green
  slack: 'hsl(31, 100%, 50%)', // Slack orange
  default: 'hsl(220, 9%, 46%)', // Muted foreground color
}

const BarChart: FC<BarChartProps> = ({
  data,
  height = 200,
  className,
  showPlatformColors = true,
}) => {
  const processedData = useMemo(() => {
    // Group by date and aggregate values
    const groupedByDate = data.reduce((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = {}
      }
      if (!acc[item.date][item.platform]) {
        acc[item.date][item.platform] = 0
      }
      acc[item.date][item.platform] += item.value
      return acc
    }, {} as Record<string, Record<string, number>>)

    // Convert to array format for rendering
    const dates = Object.keys(groupedByDate).sort()
    const allPlatforms = [...new Set(data.map(d => d.platform))].sort()

    const maxValue = Math.max(
      ...dates.map(date =>
        Object.values(groupedByDate[date]).reduce((sum, val) => sum + val, 0),
      ),
      1, // Ensure maxValue is at least 1 to avoid division by zero
    )

    return dates.map(date => {
      const platforms = allPlatforms.map(platform => ({
        platform,
        value: groupedByDate[date][platform] || 0,
        color: PLATFORM_COLORS[platform] || PLATFORM_COLORS.default,
      }))

      const totalValue = platforms.reduce((sum, p) => sum + p.value, 0)

      const percentage = maxValue > 0 ? (totalValue / maxValue) * 100 : 0
      const result = {
        date,
        platforms,
        totalValue,
        percentage,
      }

      return result
    })
  }, [data])

  // Parse UTC date string and handle in local timezone for display
  const parseUTCDateString = (dateStr: string) => {
    // Backend sends dates in YYYY-MM-DD format (UTC dates)
    // We need to create a Date object that represents this date in local timezone
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day) // month is 0-indexed
  }

  const formatDate = (dateStr: string) => {
    const date = parseUTCDateString(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateWithDay = (dateStr: string) => {
    const date = parseUTCDateString(dateStr)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
    const monthDay = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    return `${dayName} ${monthDay}`
  }

  const isMonday = (dateStr: string) => {
    const date = parseUTCDateString(dateStr)
    return date.getDay() === 1
  }

  const formatValue = (value: number, isToken = false) => {
    if (!isToken) return value.toString()

    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`
    }
    return value.toString()
  }

  if (processedData.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted rounded-lg',
          className,
        )}
        style={{ height }}
      >
        <span className="text-muted-foreground text-sm">No data available</span>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Chart container */}
      <div
        className="relative flex items-end justify-between gap-1 px-2 pb-4 pt-4"
        style={{ height }}
      >
        {processedData.map(dayData => {
          // Improved scaling for better resolution
          const minHeightPixels = 4 // Minimum bar height in pixels for visibility
          const minHeightPercentage = (minHeightPixels / height) * 100
          const barHeight =
            dayData.totalValue > 0
              ? Math.max(dayData.percentage, minHeightPercentage)
              : 0
          return (
            <div
              key={dayData.date}
              className="flex-1 flex flex-col justify-end items-center group relative"
              style={{ height: '100%' }}
            >
              {/* Monday marker line */}
              {isMonday(dayData.date) && (
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-muted-foreground/15 z-10" />
              )}
              {/* Bar */}
              <div
                className="w-full mb-1 rounded-t-sm transition-all duration-200 hover:opacity-80"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: 'hsl(271, 82%, 50%)',
                }}
              >
                {showPlatformColors &&
                dayData.platforms.filter(p => p.value > 0).length > 0
                  ? // Stacked bars by platform
                    dayData.platforms
                      .filter(p => p.value > 0)
                      .map((platform, platformIndex) => (
                        <div
                          key={platform.platform}
                          className="w-full transition-all duration-200"
                          style={{
                            backgroundColor: platform.color,
                            height: `${
                              (platform.value / dayData.totalValue) * 100
                            }%`,
                            borderTopLeftRadius:
                              platformIndex ===
                              dayData.platforms.filter(p => p.value > 0)
                                .length -
                                1
                                ? '2px'
                                : '0',
                            borderTopRightRadius:
                              platformIndex ===
                              dayData.platforms.filter(p => p.value > 0)
                                .length -
                                1
                                ? '2px'
                                : '0',
                          }}
                          title={`${platform.platform}: ${platform.value}`}
                        />
                      ))
                  : null}
              </div>

              {/* Tooltip on hover */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  <div className="font-medium">
                    {formatDateWithDay(dayData.date)}
                  </div>
                  <div>
                    Total:{' '}
                    {formatValue(
                      dayData.totalValue,
                      data.some(d => d.label?.includes('tokens')),
                    )}
                  </div>
                  {showPlatformColors &&
                    dayData.platforms
                      .filter(p => p.value > 0)
                      .map(platform => (
                        <div
                          key={platform.platform}
                          className="flex items-center gap-1"
                        >
                          <div
                            className="w-2 h-2 rounded-sm"
                            style={{ backgroundColor: platform.color }}
                          />
                          {platform.platform}:{' '}
                          {formatValue(
                            platform.value,
                            data.some(d => d.label?.includes('tokens')),
                          )}
                        </div>
                      ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-muted-foreground px-2 mt-1">
        {processedData.map((dayData, index) => {
          // Calculate step size based on data length to show appropriate number of labels
          let step = 1
          if (processedData.length > 14) {
            // For longer ranges, show fewer labels
            step = Math.ceil(processedData.length / 7)
          } else if (processedData.length > 7) {
            // For medium ranges, show every other day
            step = 2
          }
          // For 7 days or less, show all days (step = 1)

          return (
            <div key={dayData.date} className="flex-1 text-center">
              {index % step === 0 && <span>{formatDate(dayData.date)}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BarChart
