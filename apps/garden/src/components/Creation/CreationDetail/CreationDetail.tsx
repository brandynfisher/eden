import CreationReactions from '@/components/Creation/CreationReactions'
import FollowControls from '@/components/FollowControls'
import MediaDisplay from '@/components/MediaDisplay'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { durationSinceDate } from '@/lib/time'
import { Creation } from '@eden-labs/eden-sdk'
import { Button, Divider } from 'antd'
import React, { useEffect, useState } from 'react'

const MediaViewer = ({
  creation,
  onAfterHide,
}: {
  creation: Creation
  onAfterHide: () => void
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    document.body.classList.add('overflow-hidden')
    setIsVisible(true)
  }, [])

  const hide = () => {
    document.body.classList.remove('overflow-hidden')
    setIsVisible(false)
    // wait for css transitions before unmounting
    setTimeout(() => {
      onAfterHide()
    }, 200)
  }

  return (
    <div>
      <div
        className={`transition-all duration-200 fixed inset-0 w-screen h-screen bg-black pointer-events-none z-50 bg-opacity-0 ${
          isVisible ? '!bg-opacity-95' : ''
        }`}
      />
      <div
        onClick={hide}
        className="fixed inset-0 w-screen h-screen flex items-center z-50 cursor-zoom-out"
      >
        <div className="flex w-full justify-center">
          <div
            className={`transition-all duration-125 scale-90 opacity-0 ${
              isVisible ? '!opacity-100 !scale-100' : ''
            } object-contain h-auto w-auto max-w-[calc(100vw-30px)] max-h-[calc(100vh-60px)]`}
          >
            <MediaDisplay creationUri={creation.uri} />
          </div>
        </div>
      </div>
    </div>
  )
}

const CreationDetail = ({ creation }: { creation: Creation }) => {
  const [creationData, setCreationData] = useState(creation)
  const [mediaViewerVisible, setMediaViewerVisible] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const timeSinceCreation = durationSinceDate(creation.createdAt)

  const showMediaViewer = () => {
    setMediaViewerVisible(true)
  }

  const hideMediaViewer = () => {
    setMediaViewerVisible(false)
  }

  return (
    <>
      {mediaViewerVisible && (
        <MediaViewer creation={creationData} onAfterHide={hideMediaViewer} />
      )}
      <div className="xl:flex xl:justify-center">
        <div className="w-full flex justify-center xl:justify-normal xl:w-auto items-start">
          <div className="inline-flex mb-4 max-h-72vh xl:max-h-88vh">
            <div
              onClick={showMediaViewer}
              className="flex justify-center xl:justify-end overflow-hidden cursor-zoom-in"
            >
              <MediaDisplay creationUri={creationData.uri} />
            </div>
          </div>
        </div>
        <div className="mx-auto md:max-w-[640px] xl:flex-grow xl:flex xl:flex-col xl:ml-4 xl:min-w-[320px] xl:max-w-[320px]">
          <div className="col-span-12 mb-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg p-4 bg-gray-100 dark:bg-gray-900">
            <CreationReactions
              creation={creationData}
              onChange={setCreationData}
            />
          </div>

          <div className="mb-4 col-span-4 xl:col-span-12 flex flex-col xs:flex-row min-w-0 p-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg justify-between flex-wrap">
            <div className="overflow-hidden flex items-center flex-shrink-0">
              <div className="min-w-0">
                <CreatorProfileLink creatorId={creationData.user.userId} />
              </div>
            </div>
            <div className="xl:w-full flex-shrink-0">
              <FollowControls creatorId={creationData.user.userId} />
            </div>
          </div>
          <div
            className={`col-span-8 p-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg bg-gray-100 dark:bg-gray-900 relative mb-4 ${
              !isRevealed ? 'overflow-y-hidden max-h-[220px]' : ''
            }`}
          >
            <div style={{ wordWrap: 'break-word' }}>
              <div className="flex justify-between items-center">
                <div className="font-bold">
                  /{creation.task.generator?.generatorName}
                </div>
                <div className="text-gray-400 text-xs">{timeSinceCreation}</div>
              </div>
              <Divider className="my-4" />
              <div
                title={creation.name}
                className="relative first-letter:uppercase text-sm select-text cursor-text mb-1 w-full line-clamp-3 flex text-ellipsis"
              >
                {creation.name}
              </div>
            </div>
          </div>

          <div className="flex w-full justify-center items-center mb-4">
            <Button
              type="dashed"
              className="dark:text-gray-400"
              onClick={() => setIsRevealed(!isRevealed)}
            >
              {isRevealed ? 'Hide' : 'Show'} configuration
            </Button>
          </div>

          {isRevealed && (
            <>
              <div className="p-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg justify-between flex-wrap">
                {creationData.task.config &&
                  Object.entries(creationData.task.config).map(([key, val]) => (
                    <div key={`cfg-${key}`} className="mb-4 last:mb-0">
                      <div className="text-gray-500 capitalize">{key}</div>
                      <div>{JSON.stringify(val)}</div>
                    </div>
                  ))}
              </div>

              <div className="flex w-full justify-center items-center h-full my-4">
                <Button
                  type="dashed"
                  className="dark:text-gray-400"
                  onClick={() => setIsRevealed(false)}
                >
                  Hide configuration
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default CreationDetail
