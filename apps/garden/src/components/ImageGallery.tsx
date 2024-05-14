import MediaDisplay from '@/components/MediaDisplay'
import { CONFIG } from '@/lib/config'
import { isImageUrl } from '@/lib/string'
import probe from 'probe-image-size'
import React, { useEffect, useState } from 'react'
import CdnImage from '@/components/Media/cdn-image'

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

const ImageGallery = ({ images }: { images: string[] }) => {
  const MAX_THUMBNAIL_SIZE = 96

  const [probedImageUrls, setProbedImageUrls] = useState<ProbedImage[]>()
  const [displayImage, setDisplayImage] = useState({
    url: '',
    thumbnail: '',
    aspectRatio: 100,
  })

  useEffect(() => {
    const probeImageSize = async (imageUrls: string[]) => {
      const imagesWithSizes = await Promise.all(
        imageUrls.map(async imageUrl => {
          return probeImageForSize(imageUrl, MAX_THUMBNAIL_SIZE)
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

    if (images) {
      const imageUrls = images.filter((url: string) => isImageUrl(url))
      if (imageUrls.length) {
        probeImageSize(imageUrls)
        return
      }
    }

    setProbedImageUrls(undefined)
  }, [images])
  return (
    <div className="self-start max-w-sm mx-auto mb-4 lg:mx-0 w-full">
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
                  <CdnImage
                    src={trainingImage.url}
                    alt={trainingImage.url}
                    width={trainingImage.thumbnailSize.width}
                    height={trainingImage.thumbnailSize.height}
                    className="rounded-lg w-full h-auto object-contain max-h-full"
                  />
                </div>
              ))}
            </div>

            <div className="relative flex justify-center lg:flex lg:flex-grow">
              <MediaDisplay
                aspectRatio={displayImage.aspectRatio}
                className={'media-display__main'}
                creationUri={
                  displayImage?.thumbnail || ''
                }
                previewUri={displayImage?.thumbnail}
                // onLoad={() => {
                //   setCreationImageLoaded(true)
                // }}
              />
            </div>
          </>
        )}
        {/*{conceptData?.training_images &&*/}
        {/*conceptData?.training_images[0] &&*/}
        {/*!isImageUrl(conceptData?.training_images[0]) ? (*/}
        {/*  <div className="flex items-center mb-4 gap-2">*/}
        {/*    <Button*/}
        {/*      onClick={() =>*/}
        {/*        conceptData?.training_images &&*/}
        {/*        conceptData?.training_images[0] &&*/}
        {/*        downloadFile(*/}
        {/*          conceptData?.training_images[0],*/}
        {/*          `concept_${conceptData._id}_0`,*/}
        {/*        )*/}
        {/*      }*/}
        {/*    >*/}
        {/*      Download .zip archive*/}
        {/*    </Button>*/}
        {/*    <div className="test-xs truncate">*/}
        {/*      {conceptData?.training_images[0]}*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*) : null}*/}
      </div>
    </div>
  )
}

export default ImageGallery
