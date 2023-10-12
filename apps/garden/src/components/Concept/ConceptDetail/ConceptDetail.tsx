import CodeBlock from '@/components/CodeBlock'
import ConceptDetailToolButtons from '@/components/Concept/ConceptDetail/ConceptDetailToolButtons'
import ImageZoomPan from '@/components/Creation/CreationInterface/media/ImageZoomPan'
import FollowControls from '@/components/FollowControls'
import MediaDisplay from '@/components/MediaDisplay'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import TruncatedExpandableText from '@/components/TruncatedExpandableText'
import { CONFIG } from '@/lib/config'
import { timeAgo } from '@/lib/time'
import { UserContext } from '@/providers/UserProvider'
import { Concept } from '@edenlabs/eden-sdk'
import LockIcon from '@mui/icons-material/Lock'
import { Collapse, Divider } from 'antd'
import Head from 'next/head'
import React, { useContext, useEffect, useRef, useState } from 'react'

const { Panel } = Collapse

const ConceptDetail = ({
  concept,
}: // isModal,
{
  concept: Concept
  isModal?: boolean
}) => {
  const { isAuthenticated, user, userId } = useContext(UserContext)
  const containerRef = useRef<HTMLDivElement>(null)
  const [conceptData, setConceptData] = useState<Concept>(concept)
  const timeSinceConcept = timeAgo(concept.createdAt)
  const [createdDateString, setCreatedDateString] = useState('')
  // const [conceptImageLoaded, setConceptImageLoaded] = useState(false)
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
    setConceptData(concept)
    setCreatedDateString(new Date(concept.createdAt).toLocaleString())
  }, [concept])

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
        <title>{`/${conceptData?.task?.generator?.generatorName} by ${conceptData?.user?.username} | Garden of Eden`}</title>
        <meta
          property="og:title"
          key="title"
          content={`/${conceptData?.task?.generator?.generatorName} by ${conceptData?.user?.username} | Garden of Eden`}
        />
        <meta
          property="og:description"
          content={conceptData.name}
          key="description"
        />
        <meta property="og:image" content={conceptData.thumbnail} key="image" />
        <meta property="og:image:secure_url" content={conceptData.thumbnail} />
        <meta
          property="og:image:alt"
          content={`/${conceptData?.task?.generator?.generatorName} by ${conceptData?.user?.username} | Garden of Eden`}
        />
        <meta property="og:image:type" content="image/jpeg" />
        <meta
          property="og:url"
          content={`${CONFIG.NEXT_PUBLIC_HOST}/concepts/${conceptData._id}`}
        />
      </Head>

      {zoomedInImageUrl && (
        <ImageZoomPan
          imageUrl={zoomedInImageUrl}
          onCloseHandler={hideMediaViewer}
        />
      )}

      <div ref={containerRef} className="lg:flex lg:justify-center gap-4">
        <div className="flex flex-col flex-grow items-center">
          <div className="mx-auto mb-4 md:max-w-[640px] lg:mx-0 w-full">
            <div className="mb-4">
              <h3>Samples</h3>
              <div className="relative flex justify-center">
                <div
                  onClick={() => handlePreviewClick(conceptData.thumbnail)}
                  className="relative flex justify-center flex flex-grow"
                >
                  <MediaDisplay
                    priority={true}
                    aspectRatio={100}
                    className={'media-display__main'}
                    creationUri={
                      conceptData && conceptData?.thumbnail
                        ? conceptData?.thumbnail
                        : `${CONFIG.NEXT_PUBLIC_HOST}/placeholder.png`
                    }
                    previewUri={conceptData?.thumbnail}
                    // onLoad={() => {
                    //   setConceptImageLoaded(true)
                    // }}
                  />
                  {conceptData.isPrivate ? (
                    <div
                      className={`flex absolute right-1 top-1 z-10 bg-gray-700 rounded-full w-8 h-8 items-center justify-center pointer-events-none`}
                    >
                      <LockIcon fontSize="small" className="text-white" />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto lg:mx-0 md:max-w-[640px]  lg:ml-4 lg:min-w-[320px] lg:max-w-[320px]">
          <div className="mb-4 col-span-4 xl:col-span-12 flex gap-2 min-w-0 p-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg justify-between flex-wrap">
            <div className="overflow-hidden flex items-center flex-shrink-0 flex-grow max-w-full">
              <CreatorProfileLink
                creatorId={conceptData?.user?.userId}
                creatorName={conceptData?.user?.username}
                creatorImage={conceptData?.user?.userImage || ''}
              />
            </div>
            {showFollowControls && (
              <div className="flex items-center flex-shrink-0 ">
                <FollowControls
                  creatorId={conceptData?.user?.userId}
                  showStats={false}
                />
              </div>
            )}
          </div>

          <div className="col-span-8 p-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg bg-gray-100 dark:bg-gray-900 relative mb-4">
            <div style={{ wordWrap: 'break-word' }}>
              <div className="flex justify-between items-center">
                <div className="font-bold">
                  /{conceptData?.task?.generator?.generatorName}
                </div>
                <div
                  className="text-gray-400 text-xs"
                  title={createdDateString}
                >
                  {timeSinceConcept}
                </div>
              </div>
              <Divider className="my-4" />

              <TruncatedExpandableText text={conceptData?.name} />
            </div>
          </div>

          <div className="flex mb-4 min-w-0 p-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg flex-wrap gap-4">
            <div className="w-full">
              <div className="flex gap-2 justify-between">
                <div>Training Images</div>
                {conceptData?.training_images?.length || 0}
              </div>
              <div className="flex gap-2 justify-between">
                <div>Checkpoint</div>
                <div>{conceptData?.checkpoint}</div>
              </div>
            </div>
          </div>

          <div className="flex mb-4 min-w-0 p-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg flex-wrap gap-4">
            <ConceptDetailToolButtons concept={concept} />
          </div>

          {/* //@todo add config params and eden sdk for this once we have some prod data */}
          {/*<ConfigParamsTabs data={concept} />*/}

          <Collapse expandIconPosition="start" className="mb-4">
            <Panel key={'1'} header={'Raw JSON'}>
              <CodeBlock
                code={JSON.stringify(conceptData, null, 2)}
                language="javascript"
              />
            </Panel>
          </Collapse>
        </div>
        {/*{loadSimilar && creationImageLoaded && (*/}
        {/*  <SimilarConcepts*/}
        {/*    creation={creation}*/}
        {/*    containerRef={containerRef}*/}
        {/*    isModal={isModal}*/}
        {/*  />*/}
        {/*)}*/}
      </div>
    </>
  )
}

export default ConceptDetail
