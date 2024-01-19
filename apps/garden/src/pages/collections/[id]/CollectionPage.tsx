import {
  OrderByLatest,
  OrderByPopularity,
} from '@/components/Layout/buttons/OrderByButtons'
import LoadingIndicator from '@/components/LoadingIndicator'
import MasonryInfiniteContainer from '@/components/Masonry/MasonryInfiniteContainer'
import { useCollection } from '@/hooks/useCollection'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { Collection } from '@edenlabs/eden-sdk'
import { App, Space } from 'antd'
import axios from 'axios'
import dynamic from 'next/dynamic'
import router from 'next/router'
import React, { useContext } from 'react'

const CollectionHeader = dynamic(
  () => import('@/components/Collections/CollectionHeader'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const CollectionPageContent = ({ collection }: { collection: Collection }) => {
  const { message } = App.useApp()
  const { isAuthenticated, userId, user } = useContext(UserContext)
  const [deleteLoading, setDeleteLoading] = React.useState(false)

  const isAuthUser = isAuthenticated && collection?.creatorId === userId

  const onDeleteButtonClick = async () => {
    setDeleteLoading(true)
    try {
      await axios.delete(`/api/collections/${collection._id}`)
      const userProfilePath =
        isAuthenticated && user && user.username
          ? `/creators/${user.username?.toLowerCase()}`
          : ''
      await router.push(userProfilePath)
    } catch (err) {
      handleAxiosError(err, message)
    }
    setDeleteLoading(false)
  }

  return (
    <div className={`flex flex-col`}>
      <Space direction="vertical">
        <CollectionHeader
          collection={collection}
          isAuthUser={isAuthUser}
          onDeleteButtonClick={onDeleteButtonClick}
          deleteLoading={deleteLoading}
        />
        <div className="mt-4">
          <MasonryInfiniteContainer
            key={`collection_${collection._id}`}
            itemType="creation"
            query={{ collectionId: collection._id }}
            filters={[OrderByLatest, OrderByPopularity]}
          />
        </div>
      </Space>
    </div>
  )
}

const CollectionPage = ({ data }: { data: Collection }) => {
  const { collection: collectionData } = useCollection(data ? data._id : null, {
    fallbackData: data,
  })

  if (!data) {
    return null
  }

  return <CollectionPageContent collection={collectionData || data} />
}

export default CollectionPage
