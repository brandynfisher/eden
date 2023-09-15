import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import LoadingIndicator from '@/components/LoadingIndicator'
import {
  OrderByBookmarks,
  OrderByLatest,
  OrderByPraises,
} from '@/components/OrderByButtons'
import { useCollection } from '@/hooks/useCollection'
import { CONFIG } from '@/lib/config'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { Collection } from '@edenlabs/eden-sdk'
import { App, Space } from 'antd'
import axios from 'axios'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import router from 'next/router'
import React, { useContext } from 'react'

const CollectionHeader = dynamic(
  () => import('@/components/Collections/CollectionHeader'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const MasonryInfinite = dynamic(() => import('@/components/MasonryInfinite'), {
  loading: () => <LoadingIndicator />,
})

const CollectionPageContent = ({ collection }: { collection: Collection }) => {
  const { message } = App.useApp()
  const { isAuthenticated, address, user } = useContext(UserContext)
  const [deleteLoading, setDeleteLoading] = React.useState(false)

  const isAuthUser = isAuthenticated && collection?.creatorId === address

  const onDeleteButtonClick = async () => {
    setDeleteLoading(true)
    try {
      await axios.post(`/api/collections/delete`, {
        collectionId: collection._id,
      })
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
    <>
      <Head>
        <title>{`Collection "${collection.name}" by ${collection.creatorName} | Garden of Eden`}</title>
        <meta
          property="og:title"
          key="title"
          content={`Collection "${collection.name}" by ${collection.creatorName} | Garden of Eden`}
        />
        <meta
          property="og:description"
          content={`${collection.creations.length} creations curated by ${collection.creatorName}`}
          key="description"
        />
        <meta
          property="og:image"
          content={collection.displayImageUri}
          key="image"
        />
        <meta
          property="og:image:secure_url"
          content={collection.displayImageUri}
        />
        <meta
          property="og:image:alt"
          content={`${collection.name} - Collection by ${collection.creatorName}`}
        />
        <meta
          property="og:url"
          content={`${CONFIG.NEXT_PUBLIC_HOST}/collections/${collection._id}`}
        />
      </Head>
      <div className={`flex flex-col`}>
        <Space direction="vertical">
          <CollectionHeader
            collection={collection}
            isAuthUser={isAuthUser}
            onDeleteButtonClick={onDeleteButtonClick}
            deleteLoading={deleteLoading}
          />
          <div className="mt-4">
            <MasonryInfinite
              query={{ collectionId: collection._id }}
              hasSort={[OrderByLatest, OrderByPraises, OrderByBookmarks]}
              type="creations"
              itemComponent={CreationCard}
            />
          </div>
        </Space>
      </div>
    </>
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
