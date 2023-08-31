import AccountMigrationProfileBanner from '@/components/Banners/AccountMigrationProfileBanner'
import CharacterAvatar from '@/components/Characters/CharacterAvatar'
import CopyUrlButton from '@/components/CopyUrlButton'
import FollowControls from '@/components/FollowControls'
import ProfileHeaderName from '@/components/Profile/ProfileHeaderName'
import ShareButton from '@/components/ShareButton'
import { useCreator } from '@/hooks/useCreator'
import { CONFIG } from '@/lib/config'
import { handleAxiosError } from '@/lib/fetcher'
import { LoadingOutlined, UploadOutlined } from '@ant-design/icons'
import { useUser } from '@clerk/nextjs'
import { Creator } from '@edenlabs/eden-sdk'
import { useClickOutside } from '@mantine/hooks'
import { App, Button, Form } from 'antd'
import React, { ChangeEvent, useEffect, useState } from 'react'

const convertBase64 = (file: File): Promise<string | ArrayBuffer | null> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.readAsDataURL(file)

    fileReader.onload = () => {
      resolve(fileReader.result)
    }

    fileReader.onerror = error => {
      reject(error)
    }
  })
}

const ProfileHeader = ({
  creatorId,
  creator,
  isConnectedUser,
  numCreations,
}: {
  creatorId: string
  creator: Creator | undefined
  isConnectedUser: boolean
  numCreations: number | undefined
}) => {
  const { mutate: refetchCreator } = useCreator(creatorId)
  const { message } = App.useApp()
  const [isLoading, setIsLoading] = useState(true)
  const [imageSubmitLoading, setImageSubmitLoading] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [displayImage, setDisplayImage] = useState<string | undefined>()
  const [encodedImage, setEncodedImage] = useState<
    string | ArrayBuffer | null
  >()
  const [userMigrated /*setUserMigrated*/] = useState()
  const [showImageUploader, setShowImageUploader] = useState(false)
  const [form] = Form.useForm()
  const clickOutsideTargetRef = useClickOutside(() =>
    setShowImageUploader(false),
  )
  const { user } = useUser()

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return
    }

    const file = event.target.files[0]
    const base64encoding = await convertBase64(file)
    if (base64encoding) {
      setEncodedImage(base64encoding)
    }
  }

  useEffect(() => {
    setIsLoading(true)

    if (!creator) {
      return
    }

    if (creator?.username) {
      setDisplayName(creator?.username)
    } else {
      setDisplayName(creatorId)
    }

    setDisplayImage(creator?.userImage)

    setIsLoading(false)
  }, [creator, creatorId])

  const updateClerkUserImage = async (newImage: string) => {
    return user?.setProfileImage({ file: newImage })
  }

  const handleImageSubmit = async () => {
    setImageSubmitLoading(true)
    message.destroy()

    try {
      if (!encodedImage) {
        message.error('Failed to update image!')
        setImageSubmitLoading(false)
        return
      }

      const updateImageResponse = await updateClerkUserImage(
        encodedImage.toString(),
      )

      if (!updateImageResponse) {
        message.error('Failed to update image!')
        setImageSubmitLoading(false)
        return
      }

      message.success('Image updated successfully!')
      await refetchCreator({
        ...creator,
        userImage: updateImageResponse.publicUrl,
      })
      setDisplayImage(
        updateImageResponse.publicUrl
          ? updateImageResponse.publicUrl
          : undefined,
      )
      setShowImageUploader(false)
    } catch (err) {
      handleAxiosError(err, message)
      message.error('Failed to update image!')
    } finally {
      setImageSubmitLoading(false)
    }
  }

  return (
    <div className="flex flex-col border border-solid border-gray-300 dark:border-gray-900 rounded-lg p-4 relative">
      <div className="flex w-full items-center justify-start gap-4 items-stretch">
        <div className="flex flex-col items-center h-full flex-shrink-0 w-min">
          <div
            className={`w-[90px] h-[90px] ${
              isConnectedUser
                ? 'hover:brightness-125 transition-all cursor-pointer'
                : ''
            }`}
            onClick={() => isConnectedUser && setShowImageUploader(true)}
          >
            <CharacterAvatar
              id={creatorId}
              name={displayName || ''}
              imageUri={displayImage || ''}
              size="auto"
            />
          </div>
          {isConnectedUser && (
            <div
              ref={clickOutsideTargetRef}
              className="flex flex-col mt-2 relative"
            >
              <Button
                size="small"
                className="!px-3 font-mono"
                onClick={() => setShowImageUploader(!showImageUploader)}
              >
                <UploadOutlined /> Set Image
              </Button>
              {showImageUploader && (
                <div className="bg-gray-400 dark:bg-gray-800 p-2 rounded-lg top-8 absolute z-10">
                  <Form
                    form={form}
                    name="creatorProfile"
                    onFinish={handleImageSubmit}
                    className="flex gap-2 justify-center items-center creatorProfile"
                  >
                    <input
                      name="userImage"
                      id="userImage"
                      type="file"
                      onChange={ev => uploadImage(ev)}
                      maxLength={1}
                      accept={'image/png,image/jpeg,image/webp'}
                    />
                    <div>
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="w-full"
                        disabled={
                          isLoading || imageSubmitLoading || !encodedImage
                        }
                      >
                        Save
                      </Button>
                      <Button
                        type="text"
                        className="mt-2"
                        onClick={() => setShowImageUploader(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Form>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center w-full min-w-0 h-full">
          {isLoading ? (
            <div>
              <LoadingOutlined />
            </div>
          ) : (
            <div className="flex items-center flex-wrap md:flex-nowrap">
              <ProfileHeaderName
                isOwnProfile={isConnectedUser}
                displayName={displayName}
                setDisplayName={setDisplayName}
              />
              <div className="flex gap-1">
                <CopyUrlButton
                  url={`${
                    CONFIG.NEXT_PUBLIC_HOST
                  }/creators/${displayName?.toLowerCase()}`}
                />
                {navigator && !!navigator.share && (
                  <ShareButton
                    title={'Share Creation'}
                    url={`${
                      CONFIG.NEXT_PUBLIC_HOST
                    }/creators/${displayName?.toLowerCase()}`}
                  />
                )}
              </div>
            </div>
          )}
          <div>
            <div className="text-sm my-1">
              <strong>{numCreations || 0}</strong> Creations
            </div>
            <div className="col-span-full sm:col-span-1">
              <FollowControls creatorId={creatorId} showStats={true} />
            </div>
          </div>
        </div>
      </div>
      {isConnectedUser && !userMigrated ? (
        <AccountMigrationProfileBanner />
      ) : null}
    </div>
  )
}

export default ProfileHeader
