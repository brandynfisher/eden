import { UserContext } from '@/providers/UserProvider'
import { Button } from 'antd'
import Link from 'next/link'
import React, { useContext } from 'react'

const OrderSuccessPage = ({ data }: { data: { session: { id: string } } }) => {
  const { isAuthenticated, user } = useContext(UserContext)

  return (
    <div className="flex justify-center max-w-4xl">
      <div>
        <h1>Thanks for your order, {user?.username}!</h1>
        <div className="mt-4 mb-2">
          {isAuthenticated && (
            <Link href="/create/creations">
              <Button
                type="dashed"
                className="font-mono flex items-center text-gray-400"
              >
                <div>Go create!</div>
              </Button>
            </Link>
          )}
        </div>

        <div className="hidden">({JSON.stringify(data.session, null, 2)})</div>
      </div>
    </div>
  )
}

export default OrderSuccessPage
