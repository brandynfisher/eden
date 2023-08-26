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
import probe from 'probe-image-size'
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
  const [mediaViewerVisible, setMediaViewerVisible] = useState(false)
  const timeSinceConcept = timeAgo(concept.createdAt)
  const [createdDateString, setCreatedDateString] = useState('')
  // const [conceptImageLoaded, setConceptImageLoaded] = useState(false)

  const pageTitle = `/${concept?.task?.generator?.generatorName} by ${concept?.user?.username} | Garden of Eden`

  const showMediaViewer = () => {
    setMediaViewerVisible(true)
  }

  const hideMediaViewer = () => {
    setMediaViewerVisible(false)
  }

  useEffect(() => {
    setConceptData(concept)
    setCreatedDateString(new Date(concept.createdAt).toLocaleString())
  }, [concept])

  // useEffect(() => {
  //   setConceptImageLoaded(false)
  // }, [concept.uri])

  const [probedImageUrls, setProbedImageUrls] =
    useState<{ url: string; size: { width: number; height: number } }[]>()

  useEffect(() => {
    const probeImageSize = async (imageUrls: string[]) => {
      const imagesWithSizes = await Promise.all(
        imageUrls.map(async imageUrl => {
          const imageWithSize = { url: imageUrl, size: { width: 0, height: 0 } }
          imageWithSize.size = await probe(imageUrl)

          return imageWithSize
        }),
      )

      setProbedImageUrls(imagesWithSizes)
    }

    if (conceptData.training_images) {
      probeImageSize(conceptData?.training_images)
      return
    }

    setProbedImageUrls(undefined)
  }, [conceptData.training_images])

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta property="og:title" key="title" content={pageTitle} />
        <meta
          property="og:description"
          content={conceptData.name}
          key="description"
        />
        <meta property="og:image" content={conceptData.thumbnail} key="image" />
        <meta property="og:image:secure_url" content={conceptData.thumbnail} />
        <meta property="og:image:alt" content={pageTitle} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta
          property="og:url"
          content={`${CONFIG.NEXT_PUBLIC_HOST}/concepts/${conceptData._id}`}
        />
      </Head>

      <div ref={containerRef}>
        <div className="lg:flex lg:flex-grow xl:flex xl:justify-center">
          <div className="relative mx-auto mb-4 lg:mb-0 lg:flex lg:flex-grow xl:mx-0 xl:flex-grow xl:flex xl:flex-col xl:min-w-[320px]">
            {/*<div*/}
            {/*  onClick={showMediaViewer}*/}
            {/*  className="relative flex justify-center lg:flex lg:flex-grow"*/}
            {/*  style={{ width: 'fit-content', margin: '0 auto' }}*/}
            {/*>*/}
            {/*  <MediaDisplay*/}
            {/*    creationUri={*/}
            {/*      conceptData?.thumbnail*/}
            {/*        ? conceptData.thumbnail*/}
            {/*        : '/placeholder.png'*/}
            {/*    }*/}
            {/*    previewUri={conceptData?.thumbnail}*/}
            {/*    showPreview={mediaViewerVisible}*/}
            {/*    onPreviewClose={hideMediaViewer}*/}
            {/*    // onLoad={() => {*/}
            {/*    //   setCreationImageLoaded(true)*/}
            {/*    // }}*/}
            {/*  />*/}
            {/*</div>*/}

            {probedImageUrls && (
              <div className="flex gap-2 flex-wrap mt-4 mx-auto md:max-w-[640px] lg:max-w-full lg:mx-0 xl:flex-grow">
                {probedImageUrls &&
                  probedImageUrls.map(trainingImage => (
                    <div
                      key={trainingImage.url}
                      className="max-w-[200px] max-h-[200px] overflow-hidden"
                      onClick={showMediaViewer}
                    >
                      <MediaDisplay
                        creationUri={
                          trainingImage.url
                            ? trainingImage.url
                            : '/placeholder.png'
                        }
                        previewUri={trainingImage.url}
                        showPreview={mediaViewerVisible}
                        onPreviewClose={hideMediaViewer}
                        // onLoad={() => {
                        //   setCreationImageLoaded(true)
                        // }}
                      />
                      {/*<Image src={trainingImage.url} alt={trainingImage.url} width={trainingImage.size.width} height={trainingImage.size.height} className="rounded-lg w-full h-auto object-contain max-h-full max-w-full bg-gray-900"/>*/}
                    </div>
                  ))}
              </div>
            )}
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

            <Collapse expandIconPosition="start" className="mb-4">
              <Panel key={'1'} header={'Raw JSON'}>
                <CodeBlock
                  code={JSON.stringify(conceptData, null, 2)}
                  language="javascript"
                />
              </Panel>
            </Collapse>

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
