import CardToolsDropdown from '@/components/Card/CardToolsDropdown'
import ConfigParamsTabs from '@/components/ConfigParamsTabs'
import CreationInfo from '@/components/Creation/CreationDetail/CreationInfo'
import ResultPreviewDisplay from '@/components/Creation/CreationInterface/Timeline/ResultPreviewDisplay'
// import SimilarCreations from '@/components/Creation/CreationDetail/SimilarCreations'
import ImageZoomPan from '@/components/Creation/CreationInterface/media/ImageZoomPan'
import CreationReactions from '@/components/Creation/CreationReactions'
import FollowControls from '@/components/FollowControls'
import MediaDisplay from '@/components/MediaDisplay'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import TruncatedExpandableText from '@/components/TruncatedExpandableText'
import { CONFIG } from '@/lib/config'
import { getAspectRatio } from '@/lib/media'
import { isImageUrl, isVideoUrl } from '@/lib/string'
import { UserContext } from '@/providers/UserProvider'
import { Concept, Creation } from '@edenlabs/eden-sdk'
import LockIcon from '@mui/icons-material/Lock'
import { Divider } from 'antd'
import Head from 'next/head'
import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

const CreationDetail = ({
  creation,
  isModal,
}: // loadSimilar,
{
  creation: Creation
  isModal?: boolean
  // loadSimilar?: boolean
}) => {
  const { isAuthenticated, user, userId } = useContext(UserContext)
  const containerRef = useRef<HTMLDivElement>(null)
  const [creationData, setCreationData] = useState<Creation | Concept>(creation)
  const [showFollowControls, setShowFollowControls] = useState(false)
  const [zoomedInImageUrl, setZoomedInImageUrl] = useState<null | string>(null)

  useEffect(() => {
    if (isAuthenticated && user?.userId === userId) {
      setShowFollowControls(true)
    } else {
      setShowFollowControls(false)
    }
  }, [isAuthenticated, user?.userId, userId])

  useEffect(() => {
    setCreationData(creation)
  }, [creation])

  const hideMediaViewer = () => {
    setZoomedInImageUrl(null)
  }

  const handlePreviewClick = (url: string | undefined) => {
    if (!url) {
      setZoomedInImageUrl(null)
      return
    }

    setZoomedInImageUrl(url)
  }

  return (
    <>
      <Head>
        <title>{`/${creation?.task?.generator?.generatorName} by ${creation?.user?.username} | Garden of Eden`}</title>
        {isVideoUrl(creation.uri) && (
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

      {zoomedInImageUrl && (
        <ImageZoomPan
          imageUrl={zoomedInImageUrl}
          onCloseHandler={hideMediaViewer}
        />
      )}

      <div ref={containerRef} data-testid="creation-detail">
        <div className="lg:flex lg:flex-grow xl:flex xl:justify-center">
          <div
            className={`relative ${
              isModal ? 'px-2' : ''
            } md:px-0 mx-auto mb-2 lg:mb-0 lg:flex lg:flex-grow xl:mx-0 xl:flex-col xl:min-w-[320px]`}
          >
            <div
              onClick={
                isImageUrl(creation.uri)
                  ? () => handlePreviewClick(creation.uri)
                  : () => false
              }
              className="relative flex justify-center flex-grow max-h-[80vh] overflow-hidden"
            >
              {isImageUrl(creation.uri) ? (
                <MediaDisplay
                  priority={true}
                  aspectRatio={getAspectRatio(
                    creation.mediaAttributes.width,
                    creation.mediaAttributes.height,
                  )}
                  creationUri={creationData?.uri}
                  previewUri={creationData?.uri}
                  thumbnailUri={creationData?.thumbnail}
                />
              ) : (
                <MediaDisplay
                  aspectRatio={getAspectRatio(
                    creation.mediaAttributes.width,
                    creation.mediaAttributes.height,
                  )}
                  creationUri={creationData?.uri}
                  thumbnailUri={creationData?.thumbnail}
                />
              )}
              {creationData.isPrivate ? (
                <div
                  className={`flex absolute right-1 top-1 z-10 bg-gray-700 rounded-full w-8 h-8 items-center justify-center pointer-events-none`}
                >
                  <LockIcon fontSize="small" className="text-white" />
                </div>
              ) : null}
            </div>
          </div>

          <div
            className={`${
              isModal ? 'px-2  md:px-0' : ''
            } lg:mx-0 xl:flex-grow xl:flex xl:flex-col lg:ml-4 lg:min-w-[320px] lg:max-w-[320px]`}
          >
            <div className="flex px-2 mb-2 border border-gray-300 dark:border-gray-800 border-solid rounded-lg justify-between">
              <CreationReactions
                creation={creationData}
                onChange={
                  setCreationData as Dispatch<
                    SetStateAction<Concept | Creation>
                  >
                }
                showCounts={true}
              />
              {creationData ? (
                <CardToolsDropdown
                  item={creationData}
                  itemType={'creation'}
                  onChange={
                    setCreationData as Dispatch<
                      SetStateAction<Concept | Creation>
                    >
                  }
                />
              ) : null}
            </div>

            <div className="mb-2 col-span-4 xl:col-span-12 flex gap-2 min-w-0 px-2 py-2 border border-gray-300 dark:border-gray-800 border-solid bg-gray-100 dark:bg-gray-900 rounded-lg justify-between">
              <div className="overflow-hidden flex items-center flex-shrink-0 flex-grow max-w-full">
                <CreatorProfileLink
                  creatorId={creationData?.user?.userId}
                  creatorName={creationData?.user?.username}
                  creatorImage={creationData?.user?.userImage || ''}
                />
              </div>
              {showFollowControls && (
                <div className="flex items-center flex-shrink-0">
                  <FollowControls
                    creatorId={creationData?.user?.userId}
                    showStats={false}
                  />
                </div>
              )}
            </div>

            <div className="relative mb-2 col-span-8 p-2 pt-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg">
              <div style={{ wordWrap: 'break-word' }}>
                <TruncatedExpandableText text={creation?.name} />
                <Divider className="my-4" />
              </div>
              <CreationInfo creation={creation} />
            </div>

            {creation.samples && creation.samples.length ? (
              <div>
                <div className="relative mb-2 col-span-8 p-2 border border-gray-300 dark:border-gray-800 border-solid rounded-lg">
                  <div className="text-gray-400 text-sm mb-2">Variations</div>
                  <div className="grid grid-cols-2 gap-2 flex-wrap">
                    {creation.samples.map(creationSampleId => (
                      <div key={creationSampleId}>
                        <ResultPreviewDisplay creationId={creationSampleId} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
            <ConfigParamsTabs data={creation} />
          </div>
        </div>
        {/*{loadSimilar ? (*/}
        {/*  <SimilarCreations*/}
        {/*    creation={creation}*/}
        {/*    containerRef={containerRef}*/}
        {/*    isModal={isModal}*/}
        {/*  />*/}
        {/*) : null}*/}
      </div>
    </>
  )
}

export default CreationDetail
