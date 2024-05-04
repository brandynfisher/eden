import { UserContext } from '@/providers/UserProvider'
import { Button, Result } from 'antd'
import Link from 'next/link'
import React, { useContext, useEffect } from 'react'
import { sendGTMEvent } from '@next/third-parties/google'

const OrderSuccessPage = () => {
  const { user } = useContext(UserContext)

  useEffect(() => {
    sendGTMEvent({
      event: 'success_checkout',
    })
  }, [])

  return (
    <div className="flex flex-col items-center justify-center max-w-4xl">
      <Result
        className="mb-0 pb-12"
        status="success"
        title={`Purchase Successful!`}
        subTitle={
          <div>
            <h1>Thanks for your order, {user?.username}!</h1>
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
