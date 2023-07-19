import { UserContext } from '@/providers/UserProvider'
import { ExperimentOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import Link from 'next/link'
import React, { useContext } from 'react'

const QuickCreateMenu = () => {
  const { isConnected } = useContext(UserContext)

  if (!isConnected) {
    return null
  }

  return (
    <Link href="/create">
      <Button className="flex items-center gap-2">
        <ExperimentOutlined />
        <div>Create</div>
      </Button>
    </Link>
  )
}

export default QuickCreateMenu
