import CreationReactions from '@/components/CreationReactions'
import CreatorProfileLink from '@/components/CreatorProfileLink'
import FollowControls from '@/components/FollowControls'
import MediaDisplay from '@/components/MediaDisplay'
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
    setIsVisible(true)
  }, [])

  const hide = () => {
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
          <img
            src={creation.uri}
            alt={creation.name}
            className={`transition-all duration-125 scale-90 opacity-0 ${
              isVisible ? '!opacity-100 !scale-100' : ''
            } object-contain h-auto w-auto max-w-[calc(100vw-30px)] max-h-[calc(100vh-60px)] rounded-xl`}
          />
        </div>
      </div>
    </div>
  )
}

const CreationDetail = ({ creation }: { creation: Creation }) => {
  // @todo: refetch after reactions (or consider global store) to avoid this.
  //  it doesnt work right as is anyway because the parent is not notified of the change
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
        <div className="xl:flex-grow xl:flex xl:flex-col xl:ml-4 xl:min-w-[320px] xl:max-w-[320px]">
          <div className="col-span-12 mb-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg p-4 bg-gray-100 dark:bg-gray-900">
            <CreationReactions
              creation={creationData}
              onChange={setCreationData}
            />
          </div>

          <div className="mb-4 col-span-4 xl:col-span-12 flex flex-col min-w-0 p-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg">
            <div className="overflow-hidden flex items-center">
              <div className="min-w-0">
                <CreatorProfileLink creatorId={creationData.user.userId} />
              </div>
            </div>
            <div>
              <FollowControls creatorId={creationData.user.userId} />
            </div>
          </div>
          <div
            className={`col-span-8 p-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg bg-gray-100 dark:bg-gray-900 relative ${
              !isRevealed ? 'overflow-y-hidden max-h-[500px]' : ''
            }`}
          >
            <div>
              <div className="flex justify-between items-center">
                <div className="font-bold">
                  /{creation.task.generator?.generatorName}
                </div>
                <div className="text-gray-400 text-xs">{timeSinceCreation}</div>
              </div>
              <Divider className="my-4" />
              <div>
                {creationData.task.config &&
                  Object.entries(creationData.task.config).map(([key, val]) => (
                    <div key={`cfg-${key}`} className="mb-4 last:mb-0">
                      <div className="text-gray-500 capitalize">{key}</div>
                      {/*// @ts-ignore: @todo: fix the feed response type*/}
                      <div>{val}</div>
                    </div>
                  ))}
              </div>
            </div>
            {!isRevealed && (
              <div className="bg-gradient-to-t from-gray-300 dark:from-black to-transparent absolute inset-0 rounded-b-lg">
                <div className="flex w-full justify-center items-end h-full">
                  <Button
                    type="dashed"
                    className="mb-4 dark:text-gray-400"
                    onClick={() => setIsRevealed(true)}
                  >
                    Show all
                  </Button>
                </div>
              </div>
            )}
          </div>
          {isRevealed && (
            <Button
              type="dashed"
              className="mt-4 dark:text-gray-400"
              onClick={() => setIsRevealed(false)}
            >
              Show less
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

export default CreationDetail
