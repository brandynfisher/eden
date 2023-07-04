import CollectionHeader from '@/components/Collections/CollectionHeader'
import CreationMasonry from '@/components/Creation/CreationMasonry'
import { useCollection } from '@/hooks/useCollection'
import { useFeed } from '@/hooks/useFeed'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { App, Space } from 'antd'
import axios from 'axios'
import { Inter } from 'next/font/google'
import router from 'next/router'
import React, { useContext } from 'react'

const inter = Inter({ subsets: ['latin'] })

const CollectionPage = ({ collectionId }: { collectionId: string }) => {
  const { message } = App.useApp()
  const { isAuthenticated, address } = useContext(UserContext)
  const { collection } = useCollection(collectionId)
  const { creations } = useFeed({ isAuthenticated, collectionId })
  const [deleteLoading, setDeleteLoading] = React.useState(false)

  const isAuthUser = isAuthenticated && collection?.creatorId === address

  const onDeleteButtonClick = async () => {
    setDeleteLoading(true)
    try {
      await axios.post(`/api/collections/delete`, {
        collectionId,
      })
      await router.push(`/me`)
    } catch (err) {
      handleAxiosError(err, message)
    }
    setDeleteLoading(false)
  }

  return collection ? (
    <div className={`flex flex-col min-h-screen ${inter.className}`}>
      <Space direction="vertical">
        <CollectionHeader
          collection={collection}
          isAuthUser={isAuthUser}
          onDeleteButtonClick={onDeleteButtonClick}
          deleteLoading={deleteLoading}
        />
        <div className="mt-4">
          {creations && <CreationMasonry creations={creations} />}
        </div>
      </Space>
    </div>
  ) : (
    <p>Loading...</p>
  )
}

export default CollectionPage
