import { Button } from 'antd'
import Link from 'next/link'
import React from 'react'

const NavButton = ({
  text,
  path,
  isActive,
}: {
  text: string
  path: string
  isActive: boolean
}) => {
  return (
    <Link href={path} className="mr-2 last:mr-0 flex">
      <Button
        type="text"
        className={`text-black dark:text-gray-300 ${
          isActive ? 'bg-gray-300 dark:bg-gray-800' : 'bg-none dark:bg-gray-900'
        } hover:text-gray-100`}
      >
        {text}
      </Button>
    </Link>
  )
}

export default NavButton
