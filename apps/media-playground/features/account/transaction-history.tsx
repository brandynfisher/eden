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

export function TransactionHistory() {
  const {
    transactions,
    hasMore,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useTransactionsQuery({ limit: 10 })

  if (isError) {
    return (
      <div className="rounded-md border p-4">
        <p className="text-destructive">Error: {error?.message}</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead className="w-[120px]">Type</TableHead>
            <TableHead className="w-[80px]">Amount</TableHead>
            {/* <TableHead className="w-[80px]">Code</TableHead> */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[60px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[40px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[40px]" />
                </TableCell>
              </TableRow>
            ))
          ) : transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            <>
              {transactions.map(transaction => (
                <TableRow key={transaction._id} className="text-xs">
                  <TableCell className="whitespace-nowrap font-mono">
                    {formatTransactionDate(transaction.createdAt)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'capitalize whitespace-nowrap',
                      transaction.amount < 0 && 'text-red-500',
                      transaction.amount > 0 && 'text-green-500',
                    )}
                  >
                    {transaction.type?.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono">
                    {transaction.amount}
                  </TableCell>
                </TableRow>
              ))}
              {hasMore && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage
                        ? 'Loading more...'
                        : 'Load more transactions'}
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
