'use client'

import { useAuthState } from '@/hooks/use-auth-state'
import { CoinsIcon } from 'lucide-react'
import * as React from 'react'

const MannaBalance = () => {
  const { balance } = useAuthState()

  return (
    <div className="text-xs flex mr-2">
      <CoinsIcon className="mr-1.5 h-4 w-4" />
      <span>{(balance || 0).toLocaleString()}</span>
    </div>
  )
}

export default MannaBalance
