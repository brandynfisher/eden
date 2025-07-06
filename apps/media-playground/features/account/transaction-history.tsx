'use client'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTransactionsQuery } from '@/hooks/query/use-transactions-query'
import { formatTransactionDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Creator } from '@edenlabs/eden-sdk'
import {
  BotIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserIcon,
} from 'lucide-react'
import Link from 'next/link'
import React, { ReactNode, useState } from 'react'

// TypeScript interfaces
interface Task {
  _id: string
  tool: string
  user: Creator
  agent: Creator
}

// Helper components to reduce duplication
const AgentLink: React.FC<{ agent: Creator }> = ({ agent }) => (
  <Link
    href={`/chat/${agent.username}`}
    className="flex items-center gap-1 hover:underline text-primary"
    onClick={e => e.stopPropagation()}
    target="_blank"
  >
    <BotIcon className="h-4 w-4 text-purple-600" />
    {agent.username}
  </Link>
)

const UserDisplay: React.FC = () => (
  <div className="flex items-center gap-1">
    <UserIcon className="h-4 w-4" /> Me
  </div>
)

const RunnerDisplay: React.FC<{ task?: Task | null }> = ({ task }) => {
  if (!task) return <>-</>
  return task.agent ? <AgentLink agent={task.agent} /> : <UserDisplay />
}

const ToolDisplay: React.FC<{ tool?: string | null }> = ({ tool }) => (
  <>{tool || '-'}</>
)

interface PaginationButtonProps {
  onClick: () => void
  disabled: boolean
  icon: ReactNode
  label: string
}

export function TransactionHistory() {
  // Number of rows per page - adjust this to change the table height automatically
  const rowsPerPage = 10
  const rowHeight = 40 // height in pixels for each row

  // Track expanded rows on mobile
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const {
    transactions,
    hasMore,
    hasPrevious,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    isFetching,
    isLoading,
    isError,
    error,
    currentPage,
    totalPages,
    totalTransactions,
  } = useTransactionsQuery({ limit: rowsPerPage })

  if (isError) {
    return (
      <div className="rounded-md border p-4">
        <p className="text-destructive">Error: {error?.message}</p>
      </div>
    )
  }

  // Define consistent padding for cells and headers
  const cellPadding = 'px-4 py-2'

  // Pagination button component to reduce duplication
  const PaginationButton: React.FC<PaginationButtonProps> = ({
    onClick,
    disabled,
    icon,
    label,
  }) => (
    <Button
      variant="outline"
      size="icon"
      className="h-7 w-7"
      disabled={disabled || isFetching}
      onClick={onClick}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </Button>
  )

  return (
    <div className="rounded-md border">
      {/* Fixed header */}
      <div className="bg-muted/30">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={cn('w-[150px]', cellPadding)}>
                Date
              </TableHead>
              <TableHead className={cn('w-[150px]', cellPadding)}>
                Type
              </TableHead>
              {/* Extra columns only visible on md and larger screens */}
              <TableHead
                className={cn('hidden md:table-cell w-[100px]', cellPadding)}
              >
                Tool
              </TableHead>
              <TableHead
                className={cn('hidden md:table-cell w-[100px]', cellPadding)}
              >
                Runner
              </TableHead>
              <TableHead className={cn('text-right', cellPadding)}>
                Amount
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      {/* Table body with responsive design */}
      <div
        style={{ height: `${rowsPerPage * rowHeight}px`, overflow: 'hidden' }}
      >
        <Table>
          <TableBody>
            {isLoading ? (
              // Show skeletons only when loading
              Array.from({ length: rowsPerPage }).map((_, i) => (
                <TableRow
                  key={i}
                  className="text-xs"
                  style={{ height: `${rowHeight}px` }}
                >
                  <TableCell
                    className={cn(
                      'w-[150px] whitespace-nowrap font-mono',
                      cellPadding,
                    )}
                  >
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell
                    className={cn('w-[150px] whitespace-nowrap', cellPadding)}
                  >
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  {/* Extra columns only visible on md and larger screens */}
                  <TableCell
                    className={cn(
                      'hidden md:table-cell w-[100px] whitespace-nowrap',
                      cellPadding,
                    )}
                  >
                    <Skeleton className="h-4 w-[70px]" />
                  </TableCell>
                  <TableCell
                    className={cn(
                      'hidden md:table-cell w-[100px] whitespace-nowrap',
                      cellPadding,
                    )}
                  >
                    <Skeleton className="h-4 w-[70px]" />
                  </TableCell>
                  <TableCell
                    className={cn(
                      'whitespace-nowrap font-mono text-right',
                      cellPadding,
                    )}
                  >
                    <Skeleton className="ml-auto h-4 w-[40px]" />
                  </TableCell>
                </TableRow>
              ))
            ) : transactions.length === 0 ? (
              // No transactions message
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              // Data is loaded
              <>
                {/* Real data rows */}
                {transactions.map(transaction => {
                  const isExpanded = expandedRows[transaction._id] || false
                  return (
                    <React.Fragment key={transaction._id}>
                      <TableRow
                        className={cn(
                          'text-xs group',
                          'md:hover:bg-muted/50',
                          'cursor-pointer md:cursor-default',
                        )}
                        style={{ height: `${rowHeight}px` }}
                        onClick={() => {
                          if (window.innerWidth < 768) {
                            // Only expand on mobile screens
                            toggleRowExpand(transaction._id)
                          }
                        }}
                      >
                        <TableCell
                          className={cn(
                            'w-[150px] whitespace-nowrap font-mono',
                            cellPadding,
                          )}
                        >
                          {formatTransactionDate(transaction.createdAt)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'w-[150px] capitalize whitespace-nowrap',
                            cellPadding,
                            transaction.amount < 0 && 'text-red-500',
                            transaction.amount > 0 && 'text-green-500',
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <span>{transaction.type?.replace(/_/g, ' ')}</span>
                            {/* Expand indicator only visible on small screens */}
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 transition-transform md:hidden ml-1',
                                isExpanded ? 'rotate-180' : '',
                              )}
                            />
                          </div>
                        </TableCell>
                        {/* Extra columns only visible on md and larger screens */}
                        <TableCell
                          className={cn(
                            'hidden md:table-cell w-[100px] whitespace-nowrap',
                            cellPadding,
                          )}
                        >
                          <ToolDisplay tool={transaction.task?.tool} />
                        </TableCell>
                        <TableCell
                          className={cn(
                            'hidden md:table-cell w-[100px] whitespace-nowrap',
                            cellPadding,
                          )}
                        >
                          <RunnerDisplay task={transaction.task} />
                        </TableCell>
                        <TableCell
                          className={cn(
                            'whitespace-nowrap font-mono text-right',
                            cellPadding,
                          )}
                        >
                          {transaction.amount}
                        </TableCell>
                      </TableRow>

                      {/* Mobile expandable row - only visible on small screens when expanded */}
                      {isExpanded && (
                        <TableRow
                          className="text-xs md:hidden bg-muted/20"
                          style={{ height: `${rowHeight}px` }}
                        >
                          <TableCell colSpan={3} className={cellPadding}>
                            <div className="flex gap-4 flex-wrap">
                              <div className="flex justify-between gap-1">
                                <span className="text-muted-foreground">
                                  Tool:
                                </span>
                                <span>
                                  <ToolDisplay tool={transaction.task?.tool} />
                                </span>
                              </div>
                              <div className="flex justify-between gap-1">
                                <span className="text-muted-foreground">
                                  Runner:
                                </span>
                                <span>
                                  <RunnerDisplay task={transaction.task} />
                                </span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}

                {/* Empty rows (no skeletons) to maintain fixed height */}
                {transactions.length < rowsPerPage &&
                  Array.from({ length: rowsPerPage - transactions.length }).map(
                    (_, i) => (
                      <TableRow
                        key={`empty-${i}`}
                        className="text-xs"
                        style={{ height: `${rowHeight}px` }}
                      >
                        <TableCell className={cn('w-[150px]', cellPadding)}>
                          &nbsp;
                        </TableCell>
                        <TableCell className={cn('w-[150px]', cellPadding)}>
                          &nbsp;
                        </TableCell>
                        <TableCell
                          className={cn(
                            'hidden md:table-cell w-[100px]',
                            cellPadding,
                          )}
                        >
                          &nbsp;
                        </TableCell>
                        <TableCell
                          className={cn(
                            'hidden md:table-cell w-[100px]',
                            cellPadding,
                          )}
                        >
                          &nbsp;
                        </TableCell>
                        <TableCell className={cellPadding}>&nbsp;</TableCell>
                      </TableRow>
                    ),
                  )}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Fixed footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs">
        <div className="text-muted-foreground min-w-[140px]">
          {isLoading ? (
            <Skeleton className="h-4 w-[120px]" />
          ) : totalTransactions > 0 ? (
            `${totalTransactions} transactions total`
          ) : (
            'No transactions'
          )}
        </div>

        <div className="flex items-center space-x-2">
          <PaginationButton
            onClick={goToFirstPage}
            disabled={!hasPrevious}
            icon={<ChevronsLeft className="h-4 w-4" />}
            label="First page"
          />

          <PaginationButton
            onClick={goToPreviousPage}
            disabled={!hasPrevious}
            icon={<ChevronLeft className="h-4 w-4" />}
            label="Previous page"
          />

          <div className="text-xs text-muted-foreground px-1 min-w-[40px] text-center">
            {isLoading ? (
              <Skeleton className="h-4 w-[30px] mx-auto" />
            ) : (
              `${currentPage} of ${totalPages || 1}`
            )}
          </div>

          <PaginationButton
            onClick={goToNextPage}
            disabled={!hasMore}
            icon={<ChevronRight className="h-4 w-4" />}
            label="Next page"
          />

          <PaginationButton
            onClick={goToLastPage}
            disabled={!hasMore}
            icon={<ChevronsRight className="h-4 w-4" />}
            label="Last page"
          />
        </div>
      </div>
    </div>
  )
}
