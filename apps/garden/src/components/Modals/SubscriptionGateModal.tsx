'use client'

import ModalTitle from '@/components/Modals/ModalTitle'
import { subscriptionTierNameMap } from '@/lib/string'
import { UserContext } from '@/providers/UserProvider'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'
import Link from 'next/link'
import React, { useContext } from 'react'

const SubscriptionGateModal = ({
  featureName,
  minimumSubscriptionTier,
  ...rest
}: {
  featureName: string
  minimumSubscriptionTier: SubscriptionTier
}) => {
  const { user } = useContext(UserContext)

  return (
    <Modal
      {...rest}
      className="modal-small max-w-md flex flex-col w-full items-center justify-center"
    >
      <ModalTitle title="Subscription Feature" />
      <div className="pt-2 p-4 text-center">
        <div className="mb-2">
          <div>
            <strong>{featureName}</strong> is a premium feature.
          </div>
          <div>
            It is available to{' '}
            <strong>{SubscriptionTier[minimumSubscriptionTier]}</strong> tier
            and above
          </div>
        </div>

        {user && user.subscriptionTier ? (
          <div className="text-gray-500 mb-2">
            Your current plan:{' '}
            <strong className="capitalize">
              {subscriptionTierNameMap[user.subscriptionTier]}
            </strong>
          </div>
        ) : null}
        <Link href={'/manna'} className="font-bold mb-2">
          Explore subscription plans
        </Link>
      </div>
    </Modal>
  )
}

export default SubscriptionGateModal
