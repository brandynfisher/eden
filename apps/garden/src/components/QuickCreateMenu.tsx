import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import Link from 'next/link'
import React from 'react'

const QuickCreateMenu = () => {
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
