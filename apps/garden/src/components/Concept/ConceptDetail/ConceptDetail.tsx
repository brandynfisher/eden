import CodeBlock from '@/components/CodeBlock'
import FollowControls from '@/components/FollowControls'
import MediaDisplay from '@/components/MediaDisplay'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import TruncatedExpandableText from '@/components/TruncatedExpandableText'
import { CONFIG } from '@/lib/config'
import { timeAgo } from '@/lib/time'
import { UserContext } from '@/providers/UserProvider'
import { Concept } from '@edenlabs/eden-sdk'
import { Collapse, Divider } from 'antd'
import Head from 'next/head'
import React, { useContext, useEffect, useRef, useState } from 'react'

const { Panel } = Collapse

const ConceptDetail = ({
  concept,
}: // isModal,
{
  concept: Concept
  // isModal?: boolean
}) => {
  const { isAuthenticated, user, address } = useContext(UserContext)
  const containerRef = useRef<HTMLDivElement>(null)
  const [conceptData, setConceptData] = useState<Concept>(concept)
  // const [mediaViewerVisible, setMediaViewerVisible] = useState(false)
  const timeSinceConcept = timeAgo(concept.createdAt)
  const [createdDateString, setCreatedDateString] = useState('')
  // const [conceptImageLoaded, setConceptImageLoaded] = useState(false)

  const pageTitle = `/${concept?.task?.generator?.generatorName} by ${concept?.user?.username} | Garden of Eden`

  // const showMediaViewer = () => {
  //   setMediaViewerVisible(true)
  // }

  // const hideMediaViewer = () => {
  //   setMediaViewerVisible(false)
  // }

  useEffect(() => {
    setConceptData(concept)
    setCreatedDateString(new Date(concept.createdAt).toLocaleString())
  }, [concept])

  // useEffect(() => {
  //   setConceptImageLoaded(false)
  // }, [concept.uri])

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta property="og:title" key="title" content={pageTitle} />
        <meta
          property="og:description"
          content={concept.name}
          key="description"
        />
        <meta property="og:image" content={concept.thumbnail} key="image" />
        <meta property="og:image:secure_url" content={concept.thumbnail} />
        <meta property="og:image:alt" content={pageTitle} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta
          property="og:url"
          content={`${CONFIG.NEXT_PUBLIC_HOST}/concepts/${concept._id}`}
        />
      </Head>

      <div ref={containerRef}>
        <div className="lg:flex lg:flex-grow xl:flex xl:justify-center">
          <div className="relative mx-auto mb-4 lg:mb-0 lg:flex lg:flex-grow xl:mx-0 xl:flex-grow xl:flex xl:flex-col xl:min-w-[320px]">
            <div
              // onClick={showMediaViewer}
              className="relative flex justify-center lg:flex lg:flex-grow"
              style={{ width: 'fit-content', margin: '0 auto' }}
            >
              <MediaDisplay
                creationUri={
                  conceptData?.thumbnail ? conceptData?.thumbnail : ''
                }
                // onLoad={() => {
                //   setConceptImageLoaded(true)
                // }}
              />
            </div>
          </div>
          <div className="mx-auto lg:mx-0 md:max-w-[640px] xl:flex-grow xl:flex xl:flex-col lg:ml-4 lg:min-w-[320px] lg:max-w-[320px]">
            <div className="mb-4 col-span-4 xl:col-span-12 flex flex-col gap-2 xs:flex-row min-w-0 p-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg justify-between flex-wrap">
              <div className="overflow-hidden flex items-center flex-shrink-0 flex-grow max-w-full">
                <CreatorProfileLink
                  creatorId={conceptData?.user?.userId}
                  creatorName={conceptData?.user?.username}
                  creatorImage={conceptData?.user?.userImage || ''}
                />
              </div>
              {!isAuthenticated && user?.userId === address && (
                <div className="flex items-center xl:w-full xl:mt-1 flex-shrink-0 ">
                  <FollowControls
                    creatorId={conceptData?.user?.userId}
                    showStats={false}
                  />
                </div>
              )}
            </div>

            <Collapse expandIconPosition="start" className="mb-4">
              <Panel key={'1'} header={'Raw JSON'}>
                <CodeBlock
                  code={JSON.stringify(conceptData, null, 2)}
                  language="javascript"
                />
              </Panel>
            </Collapse>

            <div className="col-span-8 p-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg bg-gray-100 dark:bg-gray-900 relative mb-4">
              <div style={{ wordWrap: 'break-word' }}>
                <div className="flex justify-between items-center">
                  <div className="font-bold">
                    /{concept?.task?.generator?.generatorName}
                  </div>
                  <div
                    className="text-gray-400 text-xs"
                    title={createdDateString}
                  >
                    {timeSinceConcept}
                  </div>
                </div>
                <Divider className="my-4" />

                <TruncatedExpandableText text={concept?.name} />
              </div>
            </div>

            {/*<div className="flex mb-4 min-w-0 p-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg flex-wrap gap-4">*/}
            {/*<CreationDetailToolButtons creation={concept} />*/}
            {/*</div>*/}

            {/*<ConfigParamsTabs data={concept} />*/}
          </div>
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
