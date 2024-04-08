import TextInlineEditable from '@/components/Forms/TextInlineEditable'
import { UserContext } from '@/providers/UserProvider'
import EditOutlined from '@ant-design/icons/EditOutlined'
import { useUser } from '@clerk/nextjs'
import { App, Button } from 'antd'
import React, { useContext, useState } from 'react'

const ProfileHeaderName = ({
  displayName,
  setDisplayName,
  editable,
}: {
  displayName: string
  setDisplayName: (displayName: string) => void
  editable: boolean
}) => {
  const { message } = App.useApp()
  const { maybeAuthenticate } = useContext(UserContext)
  const [isEditing, setIsEditing] = useState(false)
  const { user } = useUser()

  const handleEditNameClick = async () => {
    if (!(await maybeAuthenticate())) return
    setIsEditing(true)
  }
  const nameValidator = (updatedText: string) => {
    return !!updatedText.match(/^[a-zA-Z0-9_.-]*$/)
  }

  const updateClerkUsername = async (newName: string) => {
    await user?.update({
      username: newName,
    })
  }

  const handleNameSubmit = async (updatedText: string) => {
    await updateClerkUsername(updatedText)
    setDisplayName(updatedText)
    message.success('Name updated successfully!')
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <div
        className={`dark:text-white text-md font-semibold min-w-0 ${
          isEditing ? 'w-full' : ''
        }`}
        title={displayName}
      >
        {!isEditing ? (
          <div className="text-lg truncate">{displayName}</div>
        ) : (
          <TextInlineEditable
            text={displayName || ''}
            placeholder={'Enter new description'}
            onEditStop={() => setIsEditing(false)}
            onSubmit={handleNameSubmit}
            validator={nameValidator}
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

export default ProfileHeaderName
