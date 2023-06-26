import { EditOutlined } from '@ant-design/icons'
import { Button, Input } from 'antd'
import React, { useState } from 'react'

const ProfileHeaderName = ({
  displayName,
  isOwnProfile,
}: {
  displayName: string
  isOwnProfile: boolean
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const handleEditNameClick = () => {
    setIsEditing(true)
  }

  return (
    <div className="flex items-center">
      <div
        className="dark:text-white text-lg font-semibold truncate"
        title={displayName}
      >
        {!isEditing ? (
          displayName
        ) : (
          <div className="w-full">
            <Input defaultValue={displayName} />
            <div>
              <Button
                size="small"
                type="text"
                className="text-gray-500"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button size="small" type="text">
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
              className="ml-2"
              onClick={handleEditNameClick}
            >
              <EditOutlined className="text-xl" />
            </Button>
          )}
        </>
      )}
    </div>
  )
}

export default ProfileHeaderName
