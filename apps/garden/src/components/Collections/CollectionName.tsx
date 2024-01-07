import { useCollection } from '@/hooks/useCollection'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import EditOutlined from '@ant-design/icons/EditOutlined'
import { useClickOutside } from '@mantine/hooks'
import { App, Button } from 'antd'
import axios from 'axios'
import React, { useContext, useState } from 'react'

const CollectionName = ({
  collectionId,
  isOwnProfile,
}: {
  collectionId: string
  isOwnProfile: boolean
}) => {
  const { message } = App.useApp()
  const { maybeAuthenticate } = useContext(UserContext)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const clickOutsideTargetRef = useClickOutside(() => setIsEditing(false))
  const { collection, mutate } = useCollection(collectionId)
  const [updatedName, setUpdatedName] = useState(collection?.name)

  const handleEditNameClick = async () => {
    if (!(await maybeAuthenticate())) return
    setIsEditing(true)
    setUpdatedName(collection?.name)
  }
  const handleNameInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = ev.target.value
    setUpdatedName(newValue.trim())
  }

  const handleNameSubmit = async () => {
    setLoading(true)
    message.destroy()

    try {
      await axios.patch(`/api/collections/${collectionId}`, {
        update: {
          name: updatedName,
        },
      })
      await mutate({
        ...collection,
        name: updatedName,
      })
      setIsEditing(false)
      message.destroy()
      message.success(`Collection name changed`)
    } catch (err) {
      handleAxiosError(err, message)
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-1 w-full">
      <div
        ref={clickOutsideTargetRef}
        className={`dark:text-white text-md font-semibold min-w-0 ${
          isEditing ? 'w-full' : ''
        }`}
        title={collection?.name}
      >
        {!isEditing ? (
          <div className="text-lg truncate">Collection: {collection?.name}</div>
        ) : (
          <div className="relative w-full flex flex-col min-w-0 z-10">
            <input
              autoFocus={true}
              type="text"
              enterKeyHint="enter"
              value={updatedName}
              maxLength={32}
              minLength={3}
              autoCorrect="off"
              spellCheck="false"
              className="z-10 pl-0 ml-0 border-none shadow-none !ring-none flex h-7 max-w-full items-center text-lg font-medium bg-transparent underline decoration-dotted decoration-2 underline-offset-[6px] !outline-none"
              onChange={handleNameInputChange}
            />
            <div className="z-0 flex gap-2 absolute bg-white dark:bg-gray-800 p-2 top-full border border-gray-300 dark:border-gray-700 border-solid border-t-0 rounded-b-md anim-slide-fade-down ">
              <Button
                size="small"
                type="text"
                className="font-mono text-gray-500"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleNameSubmit}
                size="small"
                type="text"
                loading={loading}
                disabled={!updatedName || updatedName === collection?.name}
                className="font-mono"
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </div>

      {isOwnProfile && (
        <>
          {!isEditing && (
            <Button size={'small'} type="text" onClick={handleEditNameClick}>
              <EditOutlined className="text-xl" />
            </Button>
          )}
        </>
      )}
    </div>
  )
}

export default CollectionName
