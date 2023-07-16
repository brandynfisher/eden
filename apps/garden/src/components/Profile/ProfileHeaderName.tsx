import { requireAuth } from '@/lib/auth'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { EditOutlined } from '@ant-design/icons'
import { App, Button } from 'antd'
import axios from 'axios'
import React, { useContext, useState } from 'react'

const ProfileHeaderName = ({
  displayName,
  setDisplayName,
  isOwnProfile,
}: {
  displayName: string
  setDisplayName: (displayName: string) => void
  isOwnProfile: boolean
}) => {
  const { message } = App.useApp()
  const { isAuthenticated, authenticate } = useContext(UserContext)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [updatedName, setUpdatedName] = useState('')

  const handleEditNameClick = async () => {
    if (!isAuthenticated) {
      await requireAuth(authenticate)
      return
    }

    setIsEditing(true)
    setUpdatedName(displayName)
  }

  const handleNameInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setUpdatedName(ev.target.value)
  }

  const handleNameSubmit = async () => {
    setLoading(true)
    try {
      await axios.post('/api/creators/update', {
        username: updatedName,
      })
      setDisplayName(updatedName)
      setIsEditing(false)
    } catch (err) {
      handleAxiosError(err, message)
    }
    setLoading(false)
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
          <div className="relative w-full flex flex-col min-w-0 z-0">
            <input
              type="text"
              enterKeyHint="enter"
              defaultValue={displayName}
              maxLength={42}
              minLength={2}
              autoCorrect="off"
              spellCheck="false"
              className="z-10 pl-0 ml-0 border-none shadow-none !ring-none flex h-7 max-w-full items-center text-lg font-medium bg-transparent underline decoration-dotted decoration-2 underline-offset-[6px] !outline-none"
              onChange={handleNameInputChange}
            />
            <div className="z-0 flex gap-2 absolute bg-white dark:bg-gray-800 p-2 top-full border border-gray-300 dark:border-gray-700 border-solid border-t-0 rounded-b-md anim-slide-fade-down ">
              <Button
                size="small"
                type="text"
                className="text-gray-500"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleNameSubmit}
                size="small"
                type="text"
                loading={loading}
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

export default ProfileHeaderName
