import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableRow,
} from '@/components/ui/table'
import React from 'react'

type Props = {
  subscriptionBalance?: number
  foreverBalance?: number
  totalBalance?: number
}

const MannaBalanceTable = ({
  subscriptionBalance,
  foreverBalance,
  totalBalance,
}: Props) => {
  return (
    <Table className="p-0">
      <TableBody>
        <TableRow>
          <TableCell className="p-2 text-sm text-muted-foreground">
            Non-expiring
          </TableCell>
          <TableCell className="p-2 text-xs font-mono">
            {(foreverBalance || 0).toLocaleString()}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="p-2 text-sm text-muted-foreground">
            Subscription
          </TableCell>
          <TableCell className="p-2 text-xs font-mono">
            {(subscriptionBalance || 0).toLocaleString()}
          </TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className="p-2 text-sm text-muted-foreground">
            Total
          </TableCell>
          <TableCell className="p-2 text-xs font-mono font-bold">
            {(totalBalance || 0).toLocaleString()}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

export default MannaBalanceTable
