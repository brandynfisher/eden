import { UserContext } from '@/providers/UserProvider'
import { ExperimentOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import Link from 'next/link'
import React, { useContext } from 'react'

const QuickCreateButton = () => {
  return (
    <Button className="font-mono flex items-center gap-2">
      <ExperimentOutlined />
      <div>Create</div>
    </Button>
  )
}

const QuickCreateMenu = () => {
  const { isAuthenticated, authenticate } = useContext(UserContext)
  const createHomePath = '/create/creations'

  if (!isAuthenticated) {
    return (
      <div
        className="hidden xs:flex"
        onClick={() => authenticate(createHomePath)}
      >
        <QuickCreateButton />
      </div>
    )
  }

  return (
    <Link href={createHomePath}>
      <QuickCreateButton />
    </Link>
  )
}

export default QuickCreateMenu
