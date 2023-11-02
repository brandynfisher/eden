import CharacterAvatar from '@/components/Characters/CharacterAvatar'
import UploadParameter from '@/components/Creation/CreationInterface/parameters/UploadParameter'
import FollowControls from '@/components/FollowControls'
import CopyUrlButton from '@/components/Layout/buttons/CopyUrlButton'
import ShareButton from '@/components/Layout/buttons/ShareButton'
import ProfileHeaderName from '@/components/Profile/ProfileHeaderName'
import { useCreator } from '@/hooks/useCreator'
import { CONFIG } from '@/lib/config'
import { handleAxiosError } from '@/lib/fetcher'
import LoadingOutlined from '@ant-design/icons/LoadingOutlined'
import UploadOutlined from '@ant-design/icons/UploadOutlined'
import { Creator } from '@edenlabs/eden-sdk'
import { useClickOutside } from '@mantine/hooks'
import { App, Button, Form } from 'antd'
import axios from 'axios'
import React, { useEffect, useState } from 'react'

const ProfileHeader = ({
  creatorId,
  creator,
  isOwnProfile,
  numCreations,
}: {
  creatorId: string
  creator: Creator | undefined
  isOwnProfile: boolean
  numCreations: number | undefined
}) => {
  const { mutate: refetchCreator } = useCreator(creatorId)
  const { message } = App.useApp()
  const [isLoading, setIsLoading] = useState(true)
  const [imageSubmitLoading, setImageSubmitLoading] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [displayImage, setDisplayImage] = useState<string | undefined>()
  const [showImageUploader, setShowImageUploader] = useState(false)
  const [form] = Form.useForm()
  const userImageFieldValue = Form.useWatch('userImage', form)
  const clickOutsideTargetRef = useClickOutside(() =>
    setShowImageUploader(false),
  )

  useEffect(() => {
    setIsLoading(true)
    if (!creator) {
      return
    }

    if (creator.username) {
      setDisplayName(creator.username)
    } else {
      setDisplayName(creatorId)
    }
    setDisplayImage(creator?.userImage)
    setIsLoading(false)
  }, [creator, creatorId])

  const handleImageSubmit = async () => {
    setImageSubmitLoading(true)
    message.destroy()

    try {
      const creatorResponse = await axios.post('/api/creators/update', {
        userImage: userImageFieldValue,
      })
      message.success('Image updated successfully!')
      await refetchCreator(creatorResponse.data.creator)
      setDisplayImage(creatorResponse.data.creator.userImage)
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
      <div className="flex w-full justify-start gap-4 items-stretch">
        <div className="flex flex-col items-center h-full flex-shrink-0 w-min">
          <div
            className={`w-[90px] h-[90px] rounded-full overflow-hidden ${
              isOwnProfile
                ? 'hover:brightness-125 transition-all cursor-pointer'
                : ''
            }`}
            onClick={() => isOwnProfile && setShowImageUploader(true)}
          >
            <CharacterAvatar
              id={creatorId}
              name={displayName || ''}
              imageUri={displayImage || ''}
              size="auto"
            />
          </div>
          {isOwnProfile && (
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
                <div className="bg-gray-400 dark:bg-gray-800 p-2 rounded-lg top-8 absolute z-50">
                  <Form
                    form={form}
                    name="creatorProfile"
                    onFinish={handleImageSubmit}
                    className="flex gap-2 justify-center items-center creatorProfile w-[260px]"
                  >
                    <UploadParameter
                      form={form}
                      parameter={{ name: 'userImage', label: '', maxLength: 1 }}
                      key={'userImage'}
                      acceptedMimeTypes={'image/png, image/jpeg, image/webp'}
                      compact={true}
                    />
                    <div>
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="w-full"
                        disabled={
                          isLoading ||
                          imageSubmitLoading ||
                          !userImageFieldValue
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
                isOwnProfile={isOwnProfile}
                displayName={displayName}
                setDisplayName={setDisplayName}
              />
              <div className="flex gap-1">
                <CopyUrlButton
                  url={`${
                    CONFIG.NEXT_PUBLIC_HOST
                  }/creators/${displayName.toLowerCase()}`}
                />
                {navigator && !!navigator.share && (
                  <ShareButton
                    title={'Share Creation'}
                    url={`${
                      CONFIG.NEXT_PUBLIC_HOST
                    }/creators/${displayName.toLowerCase()}`}
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
    </div>
  )
}
export default ProfileHeader
