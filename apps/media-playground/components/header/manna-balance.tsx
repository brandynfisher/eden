'use client'

import { useAuthState } from '@/hooks/use-auth-state'
import { SignedIn } from '@clerk/nextjs'
import { CoinsIcon } from 'lucide-react'
import * as React from 'react'

const MannaBalance = () => {
  const { balance } = useAuthState()

  return (
    <SignedIn>
      <div className="text-xs flex mr-2">
        <CoinsIcon className="mr-1.5 h-4 w-4" />
        <span>{(balance || 0).toLocaleString()}</span>
      </div>
    </SignedIn>
  )
}

export default MannaBalance
