import { UserContext } from '@/providers/UserProvider'
import { Button, Result } from 'antd'
import Link from 'next/link'
import React, { useContext } from 'react'

const OrderCancelledPage = () => {
  const { user } = useContext(UserContext)

  // return (
  //   <div className="flex justify-center max-w-4xl">
  //     <div>
  //       <h1>Hey, {user?.username}! Your order was cancelled :(</h1>
  //
  //       <Link href="/manna">
  //         <Button
  //           type="dashed"
  //           className="font-mono flex items-center text-gray-400"
  //         >
  //           <div>Go back to products</div>
  //         </Button>
  //       </Link>
  //     </div>
  //   </div>
  // )
  return (
    <div className="flex flex-col items-center justify-center max-w-4xl">
      <Result
        className="mb-0 pb-12"
        status="warning"
        title={`Order cancelled`}
        subTitle={
          <div>
            <h1>Hey, {user?.username}! Seems like the order was cancelled</h1>
          </div>
        }
      />
      <Link key="products" href="/manna">
        <Button
          type="primary"
          className="flex items-center border border-transparent rounded-md text-center font-medium"
        >
          Go back to products
        </Button>
      </Link>
    </div>
  )
}

export default OrderCancelledPage
