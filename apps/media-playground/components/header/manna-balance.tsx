'use client'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import MannaBalanceTable from '@/features/account/manna-balance-table'
import { useAuthState } from '@/hooks/use-auth-state'
import { CoinsIcon } from 'lucide-react'
import React from 'react'

const MannaBalance = () => {
  const { balance, subscriptionBalance, foreverBalance } = useAuthState()

  return (
    <Popover>
      <PopoverTrigger title="Click to show balance breakdown">
        <div className="text-xs flex">
          <CoinsIcon className="mr-1.5 h-4 w-4" />
          <span>{(balance || 0).toLocaleString()}</span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="text-xs flex flex-col gap-1 p-0">
        <MannaBalanceTable
          subscriptionBalance={subscriptionBalance}
          foreverBalance={foreverBalance}
          totalBalance={balance}
        />
      </PopoverContent>
    </Popover>
  )
}

export default MannaBalance
