import CodeBlock from '@/components/CodeBlock'
import ConceptDetailToolButtons from '@/components/Concept/ConceptDetail/ConceptDetailToolButtons'
import ImageZoomPan from '@/components/Creation/CreationInterface/media/ImageZoomPan'
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
  size: { width: number; height: number; aspectRatio: number }
  thumbnailSize: { width: number; height: number; aspectRatio: number }
}

const probeImageForSize = async (
  imageUrl: string,
  maxThumbnailSize: number,
) => {
  const imageWithSize = {
    url: imageUrl,
    size: { width: 0, height: 0, aspectRatio: 1 },
    thumbnailSize: { width: 0, height: 0, aspectRatio: 1 },
  }
  const probeResult = await probe(imageUrl)
  imageWithSize.size = {
    ...probeResult,
    aspectRatio: (probeResult.height / probeResult.width) * 100,
  }

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

  imageWithSize.thumbnailSize.aspectRatio = imageWithSize.size.aspectRatio

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
  const timeSinceConcept = timeAgo(concept.createdAt)
  const [createdDateString, setCreatedDateString] = useState('')
  // const [conceptImageLoaded, setConceptImageLoaded] = useState(false)
  const [showFollowControls, setShowFollowControls] = useState(false)
  const [displayImage, setDisplayImage] = useState({
    url: '',
    thumbnail: '',
    aspectRatio: 100,
  })
  const [zoomedInImageUrl, setZoomedInImageUrl] = useState<null | string>(null)

  useEffect(() => {
    if (isAuthenticated && user?.userId === address) {
      setShowFollowControls(true)
    } else {
      setShowFollowControls(false)
    }
  }, [isAuthenticated, user?.userId, address])

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

  useEffect(() => {
    setConceptData(concept)
    setCreatedDateString(new Date(concept.createdAt).toLocaleString())
  }, [concept])

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
          aspectRatio: imagesWithSizes[0].size.aspectRatio,
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
                </div>
              </div>
            </div>
          </div>

          <div className="self-start max-w-sm lg:mx-0 mx-auto mb-4 lg:mx-0 w-full">
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
                            aspectRatio: trainingImage.size.aspectRatio,
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
                    onClick={() => handlePreviewClick(displayImage.url)}
                    className="relative flex justify-center lg:flex lg:flex-grow"
                  >
                    <MediaDisplay
                      aspectRatio={displayImage.aspectRatio}
                      className={'media-display__main'}
                      creationUri={
                        displayImage?.thumbnail
                          ? displayImage.thumbnail
                          : `${CONFIG.NEXT_PUBLIC_HOST}/placeholder.png`
                      }
                      previewUri={displayImage?.thumbnail}
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
                <div className="flex items-center mb-4 gap-2">
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
                  <div className="test-xs truncate">
                    {conceptData?.training_images[0]}
                  </div>
                </div>
              ) : null}
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
