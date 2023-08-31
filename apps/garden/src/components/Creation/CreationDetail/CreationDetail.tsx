import ConfigParamsTabs from '@/components/ConfigParamsTabs'
import CreationDetailToolButtons from '@/components/Creation/CreationDetail/CreationDetailToolButtons'
import SimilarCreations from '@/components/Creation/CreationDetail/SimilarCreations'
import CreationReactions from '@/components/Creation/CreationReactions'
import FollowControls from '@/components/FollowControls'
import MediaDisplay from '@/components/MediaDisplay'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import TruncatedExpandableText from '@/components/TruncatedExpandableText'
import { CONFIG } from '@/lib/config'
import { getFileExtension } from '@/lib/getFileExtension'
import { timeAgo } from '@/lib/time'
import { UserContext } from '@/providers/UserProvider'
import { Creation } from '@edenlabs/eden-sdk'
import { Divider } from 'antd'
import Head from 'next/head'
import React, { useContext, useEffect, useRef, useState } from 'react'

const CreationDetail = ({
  creation,
  isModal,
  loadSimilar,
}: {
  creation: Creation
  isModal?: boolean
  loadSimilar?: boolean
}) => {
  const { isAuthenticated, user } = useContext(UserContext)
  const containerRef = useRef<HTMLDivElement>(null)
  const [creationData, setCreationData] = useState<Creation>(creation)
  const [mediaViewerVisible, setMediaViewerVisible] = useState(false)
  const timeSinceCreation = timeAgo(creation.createdAt)
  const [createdDateString, setCreatedDateString] = useState('')
  const [creationImageLoaded, setCreationImageLoaded] = useState(false)
  const [showFollowControls, setShowFollowControls] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user?.userId === creation?.user?.userId) {
      setShowFollowControls(true)
    } else {
      setShowFollowControls(false)
    }
  }, [isAuthenticated, user?.userId, creation?.user?.userId])

  useEffect(() => {
    setCreationData(creation)
    setCreatedDateString(new Date(creation.createdAt).toLocaleString())
  }, [creation])

  const showMediaViewer = () => {
    setMediaViewerVisible(true)
  }

  const hideMediaViewer = () => {
    setMediaViewerVisible(false)
  }

  const isVideo = (creationUri: string) => {
    if (!creationUri) return null
    const extension = getFileExtension(creationUri)
    return extension === 'mp4'
  }

  const isImage = (creationUri: string) => {
    if (!creationUri) return null
    const extension = getFileExtension(creationUri)
    return extension === 'jpg'
  }

  return (
    <>
      <Head>
        <title>{`/${creation?.task?.generator?.generatorName} by ${creation?.user?.username} | Garden of Eden`}</title>
        {isVideo(creation.uri) && (
          <>
            <meta property="og:type" content="video.other" />
            <meta
              property="og:video:duration"
              content={String(creation.mediaAttributes.duration)}
            />
          </>
        )}
        <meta
          property="og:title"
          key="title"
          content={`/${creation?.task?.generator?.generatorName} by ${creation?.user?.username} | Garden of Eden`}
        />
        <meta
          property="og:description"
          content={creation.name}
          key="description"
        />
        <meta property="og:image" content={creation.thumbnail} key="image" />
        <meta property="og:image:secure_url" content={creation.thumbnail} />
        <meta
          property="og:image:alt"
          content={`/${creation?.task?.generator?.generatorName} by ${creation?.user?.username} | Garden of Eden`}
        />
        <meta property="og:image:type" content="image/jpeg" />
        <meta
          property="og:url"
          content={`${CONFIG.NEXT_PUBLIC_HOST}/creations/${creation._id}`}
        />
      </Head>

      <div ref={containerRef}>
        <div className="lg:flex lg:flex-grow xl:flex xl:justify-center">
          <div className="relative mx-auto mb-4 lg:mb-0 lg:flex lg:flex-grow xl:mx-0 xl:flex-grow xl:flex xl:flex-col xl:min-w-[320px]">
            <div
              onClick={isImage(creation.uri) ? showMediaViewer : () => null}
              className="relative flex justify-center lg:flex lg:flex-grow"
              style={{ width: 'fit-content', margin: '0 auto' }}
            >
              {isImage(creation.uri) ? (
                <MediaDisplay
                  creationUri={creationData?.uri}
                  previewUri={creationData?.thumbnail}
                  showPreview={mediaViewerVisible}
                  onPreviewClose={hideMediaViewer}
                  onLoad={() => {
                    setCreationImageLoaded(true)
                  }}
                />
              ) : (
                <MediaDisplay creationUri={creationData?.uri} />
              )}
            </div>
          </div>
          <div className="mx-auto lg:mx-0 md:max-w-[640px] xl:flex-grow xl:flex xl:flex-col lg:ml-4 lg:min-w-[320px] lg:max-w-[320px]">
            <div className="col-span-12 mb-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg p-4 bg-gray-100 dark:bg-gray-900">
              <CreationReactions
                creation={creationData}
                onChange={setCreationData}
              />
            </div>

            <div className="mb-4 col-span-4 xl:col-span-12 flex flex-col gap-2 xs:flex-row min-w-0 p-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg justify-between flex-wrap">
              <div className="overflow-hidden flex items-center flex-shrink-0 flex-grow max-w-full">
                <CreatorProfileLink
                  creatorId={creationData?.user?.userId}
                  creatorName={creationData?.user?.username}
                  creatorImage={creationData?.user?.userImage || ''}
                />
              </div>
              {showFollowControls && (
                <div className="flex items-center xl:w-full xl:mt-1 flex-shrink-0 ">
                  <FollowControls
                    creatorId={creationData?.user?.userId}
                    showStats={false}
                  />
                </div>
              )}
            </div>

            <div className="col-span-8 p-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg bg-gray-100 dark:bg-gray-900 relative mb-4">
              <div style={{ wordWrap: 'break-word' }}>
                <div className="flex justify-between items-center">
                  <div className="font-bold">
                    /{creation?.task?.generator?.generatorName}
                  </div>
                  <div
                    className="text-gray-400 text-xs"
                    title={createdDateString}
                  >
                    {timeSinceCreation}
                  </div>
                </div>
                <Divider className="my-4" />

                <TruncatedExpandableText text={creation?.name} />
              </div>
            </div>

            <div className="flex mb-4 min-w-0 p-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg flex-wrap gap-4">
              <CreationDetailToolButtons creation={creation} />
            </div>

            <ConfigParamsTabs data={creation} />
          </div>
        </div>
        {loadSimilar && creationImageLoaded ? (
          <SimilarCreations
            creation={creation}
            containerRef={containerRef}
            isModal={isModal}
          />
        ) : null}
      </div>
    </>
  )
}

export default CreationDetail
