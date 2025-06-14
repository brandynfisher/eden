'use client'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface SessionBudgetProps {
  budget?: {
    token_budget?: number
    manna_budget?: number
    turn_budget?: number
    tokens_spent?: number
    manna_spent?: number
    turns_spent?: number
  }
  className?: string
}

export const SessionBudget = ({ budget, className }: SessionBudgetProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const getProgressPercentage = (
    spent: number | undefined,
    total: number | undefined,
  ) => {
    if (!spent || !total) return 0
    return Math.min((spent / total) * 100, 100)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500 dark:bg-red-400'
    if (percentage >= 70) return 'bg-yellow-500 dark:bg-yellow-400'
    return 'bg-green-500 dark:bg-green-400'
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90)
      return 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/50'
    if (percentage >= 70)
      return 'text-yellow-700 bg-yellow-50 dark:text-yellow-300 dark:bg-yellow-950/50'
    return 'text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-950/50'
  }

  const hasBudgetLimits = (budget: SessionBudgetProps['budget']) => {
    if (!budget) return false
    return (
      (budget.token_budget !== undefined && budget.token_budget > 0) ||
      (budget.manna_budget !== undefined && budget.manna_budget > 0) ||
      (budget.turn_budget !== undefined && budget.turn_budget > 0)
    )
  }

  if (!budget || !hasBudgetLimits(budget)) {
    // If there's no budget or no limits set, show a minimal indicator
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-3 text-xs font-medium border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        disabled
      >
        <div className="flex items-center gap-2">
          <span>No budget limits</span>
        </div>
      </Button>
    )
  }

  // Calculate overall budget status
  const budgetItems = [
    {
      name: 'Tokens',
      spent: budget.tokens_spent || 0,
      total: budget.token_budget,
      percentage: getProgressPercentage(
        budget.tokens_spent,
        budget.token_budget,
      ),
    },
    {
      name: 'Manna',
      spent: budget.manna_spent || 0,
      total: budget.manna_budget,
      percentage: getProgressPercentage(
        budget.manna_spent,
        budget.manna_budget,
      ),
    },
    {
      name: 'Turns',
      spent: budget.turns_spent || 0,
      total: budget.turn_budget,
      percentage: getProgressPercentage(budget.turns_spent, budget.turn_budget),
    },
  ].filter(item => item.total !== undefined && item.total > 0)

  const maxPercentage = Math.max(...budgetItems.map(item => item.percentage))
  const criticalCount = budgetItems.filter(item => item.percentage >= 90).length
  const warningCount = budgetItems.filter(
    item => item.percentage >= 70 && item.percentage < 90,
  ).length

  const getSummaryText = () => {
    if (criticalCount > 0) {
      return `${criticalCount} critical`
    }
    if (warningCount > 0) {
      return `${warningCount} warning${warningCount >= 2 ? 's' : ''}`
    }
    return 'All good'
  }

  const getSummaryColor = () => {
    if (criticalCount > 0)
      return 'text-red-600 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/50 dark:border-red-800'
    if (warningCount > 0)
      return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-950/50 dark:border-yellow-800'
    return 'text-green-600 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950/50 dark:border-green-800'
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 px-3 text-xs font-medium border transition-all duration-200',
            getSummaryColor(),
            'hover:opacity-80',
            className,
          )}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  maxPercentage >= 90
                    ? 'bg-red-500 dark:bg-red-400'
                    : maxPercentage >= 70
                    ? 'bg-yellow-500 dark:bg-yellow-400'
                    : 'bg-green-500 dark:bg-green-400',
                )}
              />
              <span>Budget: {getSummaryText()}</span>
            </div>
            <ChevronRight className="w-3 h-3" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 mx-2 p-4 pb-6  border border-gray-200 dark:border-gray-700 shadow-lg"
        align="start"
        side="bottom"
        sideOffset={8}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                maxPercentage >= 90
                  ? 'bg-red-500 dark:bg-red-400'
                  : maxPercentage >= 70
                  ? 'bg-yellow-500 dark:bg-yellow-400'
                  : 'bg-green-500 dark:bg-green-400',
              )}
            />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Session Budget
            </h3>
            {budgetItems.length > 0 && (
              <span
                className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  criticalCount > 0
                    ? 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950/50'
                    : warningCount > 0
                    ? 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-950/50'
                    : 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-950/50',
                )}
              >
                {getSummaryText()}
              </span>
            )}
          </div>

          {budgetItems.map(item => (
            <div key={item.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {item.name}
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      getStatusColor(item.percentage),
                    )}
                  >
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {item.spent.toLocaleString()} / {item.total?.toLocaleString()}
                </span>
              </div>
              <div className="relative">
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1">
                  <div
                    className={cn(
                      'h-1 rounded-full transition-all duration-500 ease-out',
                      getProgressColor(item.percentage),
                    )}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}

          {budgetItems.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No budget information available
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
