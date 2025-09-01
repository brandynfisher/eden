'use client'

import { cn } from '@/lib/utils'
import { FC, useMemo, useState } from 'react'
import React from 'react'

interface PieChartProps {
  data: Array<{
    label: string
    value: number
    color?: string
    formattedValue?: string
  }>
  width?: number
  height?: number
  className?: string
  showLabels?: boolean
  showValues?: boolean
  valueLabel?: string // e.g., 'messages' or 'tokens'
}

const DEFAULT_COLORS = [
  '#1f77b4b3', // blue with 70% transparency
  '#ff7f0eb3', // orange with 70% transparency
  '#2ca02cb3', // green with 70% transparency
  '#d62728b3', // red with 70% transparency
  '#9467bdb3', // purple with 70% transparency
  '#8c564bb3', // brown with 70% transparency
  '#e377c2b3', // pink with 70% transparency
  '#7f7f7fb3', // gray with 70% transparency
  '#bcbd22b3', // olive with 70% transparency
  '#17becfb3', // cyan with 70% transparency
  '#aec7e8b3', // light blue with 70% transparency
  '#ffbb78b3', // light orange with 70% transparency
  '#98df8ab3', // light green with 70% transparency
  '#ff9896b3', // light red with 70% transparency
  '#c5b0d5b3', // light purple with 70% transparency
  '#c49c94b3', // light brown with 70% transparency
  '#f7b6d3b3', // light pink with 70% transparency
  '#c7c7c7b3', // light gray with 70% transparency
  '#dbdb8db3', // light olive with 70% transparency
  '#9edae5b3', // light cyan with 70% transparency
]

const PieChart: FC<PieChartProps> = ({
  data,
  width = 200,
  height = 200,
  className,
  showLabels = true,
  showValues = true,
  valueLabel = 'items',
}) => {
  console.log('[PieChart] Received data:', data)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const processedData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    if (total === 0) return []

    let currentAngle = 0
    return data.map((item, index) => {
      const percentage = (item.value / total) * 100
      const angle = (item.value / total) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle

      // Calculate path for arc
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) / 2 - 10

      const startAngleRad = (startAngle * Math.PI) / 180
      const endAngleRad = (endAngle * Math.PI) / 180

      const x1 = centerX + radius * Math.cos(startAngleRad)
      const y1 = centerY + radius * Math.sin(startAngleRad)
      const x2 = centerX + radius * Math.cos(endAngleRad)
      const y2 = centerY + radius * Math.sin(endAngleRad)

      const largeArcFlag = angle > 180 ? 1 : 0

      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ')

      // Calculate label position
      const labelAngle = startAngle + angle / 2
      const labelAngleRad = (labelAngle * Math.PI) / 180
      const labelRadius = radius * 0.7
      const labelX = centerX + labelRadius * Math.cos(labelAngleRad)
      const labelY = centerY + labelRadius * Math.sin(labelAngleRad)

      currentAngle += angle

      return {
        ...item,
        pathData,
        percentage,
        color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        labelX,
        labelY,
        angle,
      }
    })
  }, [data, width, height])

  if (processedData.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted rounded-lg',
          className,
        )}
        style={{ width, height }}
      >
        <span className="text-muted-foreground text-sm">No data available</span>
      </div>
    )
  }

  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setHoveredIndex(index)
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
  }

  return (
    <div className={cn('relative', className)} style={{ width, height }}>
      <svg width={width} height={height} className="overflow-visible">
        {processedData.map((item, index) => (
          <g key={index}>
            {/* Pie slice */}
            <path
              d={item.pathData}
              fill={item.color}
              stroke="white"
              strokeWidth={0.5}
              className="transition-all duration-200 hover:opacity-80 cursor-pointer"
              onMouseMove={e => handleMouseMove(e, index)}
              onMouseLeave={handleMouseLeave}
            />

            {/* Label */}
            {showLabels &&
              item.percentage > 5 && ( // Only show labels for slices > 5%
                <text
                  x={item.labelX}
                  y={item.labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-xs fill-white font-medium pointer-events-none"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
                >
                  {showValues ? `${Math.round(item.percentage)}%` : item.label}
                </text>
              )}
          </g>
        ))}
      </svg>

      {/* Legend */}
      {showLabels && (
        <div className="absolute -right-4 top-0 translate-x-full space-y-1">
          {processedData.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-foreground truncate max-w-[120px]">
                {item.label}
              </span>
              <span className="text-muted-foreground ml-auto">
                {item.formattedValue || item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tooltip */}
      {hoveredIndex !== null && (
        <div
          className="absolute z-10 px-3 py-2 bg-background border border-border rounded-lg shadow-lg text-sm pointer-events-none"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform:
              mousePosition.x > width / 2
                ? 'translateX(-100%)'
                : 'translateX(0)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: processedData[hoveredIndex].color }}
            />
            <span className="font-medium text-foreground">
              {processedData[hoveredIndex].label}
            </span>
          </div>
          <div className="text-muted-foreground">
            {processedData[hoveredIndex].formattedValue ||
              processedData[hoveredIndex].value}{' '}
            {valueLabel} ({Math.round(processedData[hoveredIndex].percentage)}%)
          </div>
        </div>
      )}
    </div>
  )
}

export default PieChart
