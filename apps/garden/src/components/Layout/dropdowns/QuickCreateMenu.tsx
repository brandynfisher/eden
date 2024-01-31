import { UserContext } from '@/providers/UserProvider'
import Button from '@mui/material/Button'
import Link from 'next/link'
import React, { useContext } from 'react'

const QuickCreateMenu = () => {
  const { isAuthenticated } = useContext(UserContext)

  if (!isAuthenticated) {
    return null
  }

  return (
    <Link href="/create/creations" data-testid="quick-create-button">
      <Button variant="outlined" className="font-mono flex items-center gap-2">
        Create
      </Button>
    </Link>
  )
}

export default QuickCreateMenu
