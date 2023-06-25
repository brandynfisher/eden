import { Button } from 'antd'
import Link from 'next/link'
import React, { ReactNode } from 'react'

const NavButton = ({
  text,
  path,
  isActive,
  icon,
}: {
  text: string
  path: string
  isActive?: boolean
  icon?: ReactNode
}) => {
  return (
    <Link href={path} className="mr-2 last:mr-0 flex">
      <Button
        type="text"
        className={`text-black dark:text-gray-300 ${
          isActive ? 'bg-gray-300 dark:bg-gray-800' : 'bg-none dark:bg-gray-900'
        } hover:text-gray-100`}
      >
        <div className="flex">
          {icon && <div className="mr-2">{icon}</div>}
          <div>{text}</div>
        </div>
      </Button>
    </Link>
  )
}

export default NavButton
