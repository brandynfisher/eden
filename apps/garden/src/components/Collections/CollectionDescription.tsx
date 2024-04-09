import TextInlineEditable from '@/components/Forms/TextInlineEditable'
import { useCollection } from '@/hooks/useCollection'
import { UserContext } from '@/providers/UserProvider'
import EditOutlined from '@ant-design/icons/EditOutlined'
import { App, Button } from 'antd'
import axios from 'axios'
import React, { useContext, useState } from 'react'

const CollectionDescription = ({
  collectionId,
  editable,
}: {
  collectionId: string
  editable: boolean
}) => {
  const { message } = App.useApp()
  const { maybeAuthenticate } = useContext(UserContext)
  const [isEditing, setIsEditing] = useState(false)
  const { collection, mutate } = useCollection(collectionId)

  const handleEditDescriptionClick = async () => {
    if (!(await maybeAuthenticate())) return
    setIsEditing(true)
  }

  const handleDescriptionSubmit = async (updatedText: string) => {
    await axios.patch(`/api/collections/${collectionId}`, {
      update: {
        description: updatedText,
      },
    })
    await mutate({
      ...collection,
      description: updatedText,
    })
    message.destroy()
    message.success(`Collection description changed`)
  }

  return (
    <div className="flex items-center gap-1 w-full">
      <div
        className={`dark:text-white min-w-0 ${isEditing ? 'w-full' : ''}`}
        title={collection?.description}
      >
        {!isEditing ? (
          <>
            {collection?.description ? (
              <div className="truncate">{collection?.description}</div>
            ) : (
              <>
                {editable ? (
                  <div className="text-gray-500 text-xs">Add a description</div>
                ) : null}
              </>
            )}
          </>
        ) : (
          <TextInlineEditable
            multiLine={true}
            minLength={0}
            maxLength={1000}
            text={collection?.description || ''}
            placeholder={'Enter new description'}
            onEditStop={() => setIsEditing(false)}
            onSubmit={handleDescriptionSubmit}
          />
        )}
      </div>

      {editable && (
        <>
          {!isEditing && (
            <Button
              size={'small'}
              type="text"
              onClick={() => handleEditDescriptionClick()}
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
