import { UserContext } from '@/providers/UserProvider'
import { PlusOutlined } from '@ant-design/icons'
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
      <Button className="flex items-center">
        <div className="mr-2">Create</div>
        <PlusOutlined />
      </Button>
    </Link>
  )
}

export default QuickCreateMenu
