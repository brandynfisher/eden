import { UserContext } from '@/providers/UserProvider'
import ExperimentOutlined from '@ant-design/icons/ExperimentOutlined'
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
        <ExperimentOutlined />
        <div>Create</div>
      </Button>
    </Link>
  )
}

export default QuickCreateMenu
