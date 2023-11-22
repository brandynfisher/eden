import { UserContext } from '@/providers/UserProvider'
import { Button, Result } from 'antd'
import Link from 'next/link'
import React, { useContext } from 'react'

const OrderSuccessPage = () => {
  const { user } = useContext(UserContext)

  const order = {
    product: {
      name: 'dummy',
    },
    id: '123123',
  }

  return (
    <div className="flex flex-col items-center justify-center max-w-4xl">
      <Result
        className="mb-0 pb-12"
        status="success"
        title={`Successfully purchased '${order.product.name}'`}
        subTitle={
          <div>
            <h1>Thanks for your order, {user?.username}!</h1>
            <div className="text-xs">Order Number: {order.id}</div>
          </div>
        }
      />
      <Link key="create" href="/create/creations">
        <Button
          type="primary"
          className="flex items-center border border-transparent rounded-md text-center font-medium"
        >
          <div>Start creating</div>
        </Button>
      </Link>
    </div>
  )
}

export default OrderSuccessPage
