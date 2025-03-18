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
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

export function TransactionHistory() {
  // Number of rows per page - adjust this to change the table height automatically
  const rowsPerPage = 10
  const rowHeight = 40 // height in pixels for each row

  const {
    transactions,
    hasMore,
    hasPrevious,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
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
  const cellPadding = 'px-3 py-2'

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
              <TableHead className={cn('w-[146px]', cellPadding)}>
                Type
              </TableHead>
              <TableHead className={cn('text-right', cellPadding)}>
                Amount
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      {/* Body with dynamic fixed height and overflow hidden */}
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
                    className={cn('w-[146px] whitespace-nowrap', cellPadding)}
                  >
                    <Skeleton className="h-4 w-[80px]" />
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
                <TableCell colSpan={3} className="text-center">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              // Data is loaded
              <>
                {/* Real data rows */}
                {transactions.map(transaction => (
                  <TableRow
                    key={transaction._id}
                    className="text-xs"
                    style={{ height: `${rowHeight}px` }}
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
                        'w-[146px] capitalize whitespace-nowrap',
                        cellPadding,
                        transaction.amount < 0 && 'text-red-500',
                        transaction.amount > 0 && 'text-green-500',
                      )}
                    >
                      {transaction.type?.replace(/_/g, ' ')}
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
                ))}

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
                        <TableCell className={cn('w-[146px]', cellPadding)}>
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
        {totalTransactions > 0 ? (
          <div className="text-muted-foreground min-w-[120px]">
            {totalTransactions} transactions
          </div>
        ) : null}

        <div className="ml-auto flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={!hasPrevious}
            onClick={goToFirstPage}
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First page</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={!hasPrevious}
            onClick={goToPreviousPage}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>

          <div className="text-xs text-muted-foreground px-1 min-w-[50px] text-center flex-shrink-0">
            {`${currentPage} of ${totalPages}`}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={!hasMore}
            onClick={goToNextPage}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={!hasMore}
            onClick={goToLastPage}
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last page</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
