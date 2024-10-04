'use client'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import MannaBalanceTable from '@/features/account/manna-balance-table'
import { useAuthState } from '@/hooks/use-auth-state'
import { CoinsIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const MannaBalance = () => {
  const { isSignedIn, balance, subscriptionBalance, foreverBalance } =
    useAuthState()

  if (isSignedIn && (!balance || balance <= 0)) {
    return (
      <Button asChild size="sm" variant="secondary">
        <Link href={'/settings/subscription'}>
          <CoinsIcon className="mr-1.5 h-4 w-4" />
          Get Manna!
        </Link>
      </Button>
    )
  }

  return (
    <Popover>
      <PopoverTrigger title="Click to show balance breakdown">
        <div className="text-xs flex">
          <CoinsIcon className="mr-1.5 h-4 w-4" />
          <span>{(balance || 0).toLocaleString()}</span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        collisionPadding={16}
        className="text-xs flex flex-col p-0"
      >
        <div className="px-3 py-2 text-sm text-accent-foreground flex w-full justify-between bg-accent/70 mt-0 caption-top border border-t-0 border-l-0 border-r-0 border-b-secondary overflow-hidden rounded-t-md">
          Manna Balance
          <Link
            className="text-sm underline hover:text-popover-foreground"
            href={'/settings/subscription'}
          >
            Get more!
          </Link>
        </div>
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
