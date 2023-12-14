import { UserContext } from '@/providers/UserProvider'
import { Button, Result } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useContext } from 'react'

const OrderSuccessPage = () => {
  const router = useRouter()
  const { session_id } = router.query

  const { user } = useContext(UserContext)

  const order = {
    product: {
      name: '',
    },
    id: session_id || 'n/a',
  }

  return (
    <div className="flex flex-col items-center justify-center max-w-4xl">
      <Result
        className="mb-0 pb-12"
        status="success"
        title={`Successfully purchased '${order.product.name}' !`}
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
          className="flex border border-transparent rounded-md font-medium"
        >
          Start creating
        </Button>
      </Link>
    </div>
  )
}

export default OrderSuccessPage
