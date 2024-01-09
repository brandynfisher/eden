import { useCollection } from '@/hooks/useCollection'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import EditOutlined from '@ant-design/icons/EditOutlined'
import { useClickOutside } from '@mantine/hooks'
import { App, Button } from 'antd'
import axios from 'axios'
import React, { useContext, useState } from 'react'

const CollectionDescription = ({
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
  const [updatedDescription, setUpdatedDescription] = useState(
    collection?.description,
  )

  const handleEditDescriptionClick = async () => {
    if (!(await maybeAuthenticate())) return
    setIsEditing(true)
    setUpdatedDescription(collection?.description)
  }
  const handleDescriptionInputChange = (
    ev: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newValue = ev.target.value
    setUpdatedDescription(newValue)
  }

  const handleDescriptionSubmit = async () => {
    setLoading(true)
    message.destroy()

    try {
      await axios.patch(`/api/collections/${collectionId}`, {
        update: {
          description: updatedDescription,
        },
      })
      await mutate({
        ...collection,
        description: updatedDescription,
      })
      setIsEditing(false)
      message.destroy()
      message.success(`Collection description changed`)
    } catch (err) {
      handleAxiosError(err, message)
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-1 w-full">
      <div
        ref={clickOutsideTargetRef}
        className={`dark:text-white min-w-0 ${isEditing ? 'w-full' : ''}`}
        title={collection?.description}
      >
        {!isEditing ? (
          <>
            {collection?.description ? (
              <div className="truncate">{collection?.description}</div>
            ) : (
              <>
                {isOwnProfile ? (
                  <div className="text-gray-500 text-xs">Add a description</div>
                ) : null}
              </>
            )}
          </>
        ) : (
          <div className="relative w-full flex flex-col min-w-0 z-10">
            <input
              autoFocus={true}
              type="text"
              enterKeyHint="enter"
              value={updatedDescription}
              maxLength={32}
              minLength={3}
              autoCorrect="off"
              spellCheck="false"
              className="z-10 pl-0 ml-0 border-none shadow-none !ring-none flex h-7 max-w-full items-center text-lg font-medium bg-transparent underline decoration-dotted decoration-2 underline-offset-[6px] !outline-none"
              onChange={handleDescriptionInputChange}
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
                onClick={handleDescriptionSubmit}
                size="small"
                type="text"
                loading={loading}
                disabled={
                  !updatedDescription ||
                  updatedDescription === collection?.description
                }
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
            <Button
              size={'small'}
              type="text"
              onClick={handleEditDescriptionClick}
            >
              <EditOutlined className="text-xl" />
            </Button>
          )}
        </>
      )}
    </div>
  )
}

export default CollectionDescription
