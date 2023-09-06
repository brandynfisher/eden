import { UserContext } from '@/providers/UserProvider'
import { Button } from 'antd'
import Link from 'next/link'
import React, { useContext } from 'react'

const OrderCancelledPage = () => {
  const { user } = useContext(UserContext)

  return (
    <div className="flex justify-center max-w-4xl">
      <div>
        <h1>Hey, {user?.username}! Your order was cancelled :(</h1>

        <Link href="/manna">
          <Button
            type="dashed"
            className="font-mono flex items-center text-gray-400"
          >
            <div>Go back to products</div>
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default OrderCancelledPage
