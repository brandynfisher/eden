import CodeBlock from '@/components/CodeBlock'
import ConceptDetailToolButtons from '@/components/Concept/ConceptDetail/ConceptDetailToolButtons'
import FollowControls from '@/components/FollowControls'
import MediaDisplay from '@/components/MediaDisplay'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import TruncatedExpandableText from '@/components/TruncatedExpandableText'
import { CONFIG } from '@/lib/config'
import { downloadFile } from '@/lib/files'
import { isImageUrl } from '@/lib/string'
import { timeAgo } from '@/lib/time'
import { UserContext } from '@/providers/UserProvider'
import { Concept } from '@edenlabs/eden-sdk'
import { Button, Collapse, Divider } from 'antd'
import Head from 'next/head'
import Image from 'next/image'
import probe from 'probe-image-size'
import React, { useContext, useEffect, useRef, useState } from 'react'

const { Panel } = Collapse
type ProbedImage = {
  url: string
  size: { width: number; height: number }
  thumbnailSize: { width: number; height: number }
}

const probeImageForSize = async (
  imageUrl: string,
  maxThumbnailSize: number,
) => {
  const imageWithSize = {
    url: imageUrl,
    size: { width: 0, height: 0 },
    thumbnailSize: { width: 0, height: 0 },
  }
  imageWithSize.size = await probe(imageUrl)

  if (
    imageWithSize.size.height < maxThumbnailSize &&
    imageWithSize.size.width < maxThumbnailSize
  ) {
    imageWithSize.thumbnailSize = imageWithSize.size
    return imageWithSize
  }

  if (imageWithSize.size.height > imageWithSize.size.width) {
    imageWithSize.thumbnailSize.width =
      imageWithSize.size.width / (imageWithSize.size.height / maxThumbnailSize)
    // limit height, scale width accordingly
    imageWithSize.thumbnailSize.height = maxThumbnailSize
  } else {
    imageWithSize.thumbnailSize.height =
      imageWithSize.size.height / (imageWithSize.size.width / maxThumbnailSize)
    // limit width, scale height accordingly
    imageWithSize.thumbnailSize.width = maxThumbnailSize
  }

  return imageWithSize
}

const ConceptDetail = ({
  concept,
}: // isModal,
{
  concept: Concept
  isModal?: boolean
}) => {
  const maxThumbnailSize = 96

  const { isAuthenticated, user, address } = useContext(UserContext)
  const containerRef = useRef<HTMLDivElement>(null)
  const [conceptData, setConceptData] = useState<Concept>(concept)
  const [mediaViewerVisible, setMediaViewerVisible] = useState(false)
  const timeSinceConcept = timeAgo(concept.createdAt)
  const [createdDateString, setCreatedDateString] = useState('')
  // const [conceptImageLoaded, setConceptImageLoaded] = useState(false)
  const [showFollowControls, setShowFollowControls] = useState(false)
  const [displayImage, setDisplayImage] = useState({ url: '', thumbnail: '' })

  useEffect(() => {
    if (isAuthenticated && user?.userId === address) {
      setShowFollowControls(true)
    } else {
      setShowFollowControls(false)
    }
  }, [isAuthenticated, user?.userId, address])

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

  const [probedImageUrls, setProbedImageUrls] = useState<ProbedImage[]>()

  useEffect(() => {
    const probeImageSize = async (imageUrls: string[]) => {
      const imagesWithSizes = await Promise.all(
        imageUrls.map(async imageUrl => {
          return probeImageForSize(imageUrl, maxThumbnailSize)
        }),
      )

      setProbedImageUrls(imagesWithSizes)

      if (imagesWithSizes.length) {
        setDisplayImage({
          url: imagesWithSizes[0].url,
          thumbnail: imagesWithSizes[0].url,
        })
      }
    }

    if (conceptData.training_images) {
      const imageUrls = conceptData?.training_images.filter((url: string) =>
        isImageUrl(url),
      )
      if (imageUrls.length) {
        probeImageSize(imageUrls)
        return
      }
    }

    setProbedImageUrls(undefined)
  }, [conceptData.training_images])

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

      <div ref={containerRef} className="lg:flex lg:justify-center">
        <div className="mx-auto mb-4 md:max-w-[640px] lg:mx-0">
          <h3>Samples</h3>
          {/*<div className="lg:flex lg:flex-grow xl:flex xl:justify-center">*/}
          <div className="relative">
            <div
              onClick={showMediaViewer}
              className="relative flex justify-center lg:flex lg:flex-grow"
              style={{ width: 'fit-content', margin: '0 auto' }}
            >
              <MediaDisplay
                className={'media-display__main'}
                creationUri={
                  concept && concept?.thumbnail
                    ? concept.thumbnail
                    : `${CONFIG.NEXT_PUBLIC_HOST}/placeholder.png`
                }
                previewUri={conceptData?.thumbnail}
                showPreview={mediaViewerVisible}
                onPreviewClose={hideMediaViewer}
              />
            </div>
          </div>
          {/*</div>*/}

          <h3>Training Images</h3>
          <div className="relative overflow-hidden max-w-full">
            {probedImageUrls && (
              <>
                <div className="flex items-center justify-center gap-2 flex-wrap mt-4 mx-auto md:max-w-[640px] lg:max-w-full lg:mx-0 xl:flex-grow mb-4">
                  {probedImageUrls.map(trainingImage => (
                    <div
                      key={trainingImage.url}
                      className={`flex w-[96px] h-[96px] overflow-hidden rounded-lg border border-solid ${
                        trainingImage.url === displayImage.url
                          ? 'border-gray-700 bg-gray-800'
                          : 'cursor-pointer border-gray-800 hover:border-blue-600 '
                      }`}
                      onClick={() =>
                        setDisplayImage({
                          url: trainingImage.url,
                          thumbnail: trainingImage.url,
                        })
                      }
                    >
                      <Image
                        src={trainingImage.url}
                        alt={trainingImage.url}
                        width={trainingImage.thumbnailSize.width}
                        height={trainingImage.thumbnailSize.height}
                        className="rounded-lg w-full h-auto object-contain max-h-full"
                      />
                    </div>
                  ))}
                </div>

                <div
                  onClick={showMediaViewer}
                  className="relative flex justify-center lg:flex lg:flex-grow"
                  style={{ width: 'fit-content', margin: '0 auto' }}
                >
                  <MediaDisplay
                    className={'media-display__main'}
                    creationUri={
                      displayImage?.thumbnail
                        ? displayImage.thumbnail
                        : `${CONFIG.NEXT_PUBLIC_HOST}/placeholder.png`
                    }
                    previewUri={displayImage?.thumbnail}
                    showPreview={mediaViewerVisible}
                    onPreviewClose={hideMediaViewer}
                    // onLoad={() => {
                    //   setCreationImageLoaded(true)
                    // }}
                  />
                </div>
              </>
            )}
            {conceptData?.training_images &&
            conceptData?.training_images[0] &&
            !isImageUrl(conceptData?.training_images[0]) ? (
              <div className="flex items-center mb-4">
                <div className="test-xs truncate">
                  {conceptData?.training_images[0]}
                </div>
                <Button
                  onClick={() =>
                    conceptData?.training_images &&
                    conceptData?.training_images[0] &&
                    downloadFile(
                      conceptData?.training_images[0],
                      `concept_${conceptData._id}_0`,
                    )
                  }
                >
                  Download .zip archive
                </Button>
              </div>
            ) : null}
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
              <div className="flex items-center xl:mt-1 flex-shrink-0 ">
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
              {/* instance_prompt no longer exists */}
              {/* <div className="flex gap-2 justify-between">
                  <div>Instance Prompt</div>
                  <div>{conceptData?.instance_prompt}</div>
                </div> */}
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
