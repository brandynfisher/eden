// import { PraiseButton } from '@/components/Card/CardReactions'
import CardToolsDropdown from '@/components/Card/CardToolsDropdown'
import CodeBlock from '@/components/CodeBlock'
import ConceptCardFooter from '@/components/Concept/ConceptCard/ConceptCardFooter'
import ConceptCreations from '@/components/Concept/ConceptDetail/ConceptCreations'
import ConceptInfo from '@/components/Concept/ConceptDetail/ConceptInfo'
import ImageZoomPan from '@/components/Creation/CreationInterface/media/ImageZoomPan'
import FollowControls from '@/components/FollowControls'
import MediaDisplay from '@/components/MediaDisplay'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import TruncatedExpandableText from '@/components/TruncatedExpandableText'
import { CONFIG } from '@/lib/config'
import { UserContext } from '@/providers/UserProvider'
import { Concept, Creation } from '@edenlabs/eden-sdk'
import LockIcon from '@mui/icons-material/Lock'
import { Collapse, Divider } from 'antd'
import Head from 'next/head'
import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

const { Panel } = Collapse

const ConceptDetail = ({
  concept,
  isModal,
}: {
  concept: Concept
  isModal?: boolean
}) => {
  const { isAuthenticated, user, userId } = useContext(UserContext)
  const containerRef = useRef<HTMLDivElement>(null)
  const [conceptData, setConceptData] = useState<Concept>(concept)
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
        <title>{`/concept by ${conceptData?.user?.username} | Garden of Eden`}</title>
        <meta
          property="og:title"
          key="title"
          content={`/concept by ${conceptData?.user?.username} | Garden of Eden`}
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
          content={`/concept by ${conceptData?.user?.username} | Garden of Eden`}
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

      <div ref={containerRef} data-testid="concept-detail">
        <div className="lg:flex lg:flex-grow xl:flex xl:justify-center">
          <div
            className={`relative ${
              isModal ? 'px-2' : ''
            } md:px-0 mx-auto mb-2 lg:mb-0 lg:flex lg:flex-grow xl:mx-0 xl:flex-col xl:min-w-[320px]`}
          >
            <div
              onClick={() => handlePreviewClick(conceptData.thumbnail)}
              className="relative flex justify-center flex-grow max-h-[80vh] overflow-hidden"
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

          <div
            className={`${
              isModal ? 'px-2  md:px-0' : ''
            } lg:mx-0 xl:flex-grow xl:flex xl:flex-col lg:ml-4 lg:min-w-[320px] lg:max-w-[320px]`}
          >
            <div className="flex px-2 mb-2 border border-gray-300 dark:border-gray-800 border-solid rounded-lg justify-between">
              <div className="relative flex justify-between">
                <div className="h-10">
                  <div className="hidden md:flex pointer-events-auto">
                    {/*      <PraiseButton*/}
                    {/*        item={conceptData}*/}
                    {/*        type={'concept'}*/}
                    {/*        onChange={*/}
                    {/*          setConceptData as Dispatch<*/}
                    {/*            SetStateAction<Concept | Creation>*/}
                    {/*          >*/}
                    {/*        }*/}
                    {/*        showCounts={true}*/}
                    {/*      />*/}
                  </div>
                </div>
              </div>
              {conceptData ? (
                <CardToolsDropdown
                  item={conceptData}
                  itemType={'concept'}
                  onChange={
                    setConceptData as Dispatch<
                      SetStateAction<Concept | Creation>
                    >
                  }
                />
              ) : null}
            </div>

            <div className="mb-2 col-span-4 xl:col-span-12 flex gap-2 min-w-0 px-2 py-2 border border-gray-300 dark:border-gray-800 border-solid bg-gray-100 dark:bg-gray-900 rounded-lg justify-between">
              <div className="overflow-hidden flex items-center flex-shrink-0 flex-grow max-w-full">
                <CreatorProfileLink
                  creatorId={conceptData?.user?.userId}
                  creatorName={conceptData?.user?.username}
                  creatorImage={conceptData?.user?.userImage || ''}
                />
              </div>
              {showFollowControls && (
                <div className="flex items-center flex-shrink-0">
                  <FollowControls
                    creatorId={conceptData?.user?.userId}
                    showStats={false}
                  />
                </div>
              )}
            </div>

            <div className="relative mb-2 col-span-8 p-2 pt-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg">
              <div className="flex gap-2 items-center justify-between">
                <TruncatedExpandableText text={concept?.name} />
                <div className="flex gap-2">
                  <ConceptCardFooter concept={concept} />
                </div>
              </div>
              <Divider className="my-4" />
              <ConceptInfo concept={concept} />
            </div>

            <Collapse
              expandIconPosition="start"
              className="mb-2 border border-gray-300 dark:border-gray-800 border-solid bg-gray-100 dark:bg-gray-900"
            >
              <Panel key={'1'} header={'Raw JSON'}>
                <CodeBlock
                  code={JSON.stringify(conceptData, null, 2)}
                  language="javascript"
                />
              </Panel>
            </Collapse>
          </div>
        </div>
      </div>
      <div className="px-2 md:px-0 md:mt-2">
        <ConceptCreations concept={concept} />
      </div>
    </>
  )
}

export default ConceptDetail
