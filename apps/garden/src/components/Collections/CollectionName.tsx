import TextInlineEditable from '@/components/Forms/TextInlineEditable'
import { useCollection } from '@/hooks/useCollection'
import { UserContext } from '@/providers/UserProvider'
import EditOutlined from '@ant-design/icons/EditOutlined'
import { App, Button } from 'antd'
import axios from 'axios'
import React, { useContext, useState } from 'react'

const CollectionName = ({
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

  const handleEditNameClick = async () => {
    if (!(await maybeAuthenticate())) return
    setIsEditing(true)
  }

  const handleNameSubmit = async (updatedText: string) => {
    await axios.patch(`/api/collections/${collectionId}`, {
      update: {
        name: updatedText,
      },
    })
    await mutate({
      ...collection,
      name: updatedText,
    })
    message.destroy()
    message.success(`Collection name changed`)
  }

  return (
    <div className="flex items-center gap-1 w-full">
      <div
        className={`dark:text-white text-md font-semibold min-w-0 ${
          isEditing ? 'w-full' : ''
        }`}
        title={collection?.name}
      >
        {!isEditing ? (
          <div className="text-lg truncate">Collection: {collection?.name}</div>
        ) : (
          <TextInlineEditable
            text={collection?.name || ''}
            placeholder={'Enter new name'}
            onEditStop={() => setIsEditing(false)}
            onSubmit={handleNameSubmit}
          />
        )}
      </div>

      {editable && (
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
