import ExpandOutlined from '@ant-design/icons/ExpandOutlined'
import ExperimentOutlined from '@ant-design/icons/ExperimentOutlined'
import { Skeleton } from 'antd'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import CdnImage from '@/components/Media/cdn-image'

const ImagePreviewMask = () => (
  <div className="image-preview-mask absolute inset-0 !opacity-60 hover:!opacity-100">
    <div className="rounded-lg bg-gray-300 dark:bg-gray-800 h-8 w-8 flex items-center justify-center absolute">
      <ExpandOutlined className="text-xl" />
    </div>
  </div>
)

const LoadingPlaceholder = () => {
  return (
    <Skeleton.Node
      active={true}
      className="flex !min-h-[300px] image-loading-placeholder bg-gray-400 dark:bg-black !bg-opacity-90"
    >
      <ExperimentOutlined className="text-2xl" />
    </Skeleton.Node>
  )
}

const NextImageResult = ({
  fullSizeUrl,
  previewSizeUrl,
  showPreview,
  onLoad,
}: {
  fullSizeUrl?: string
  previewSizeUrl?: string
  showPreview?: boolean
  onLoad?: () => void
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const previewImageRef = useRef<HTMLImageElement>(null)

  const handleOnLoad = useCallback(() => {
    if (!isLoaded) {
      setIsLoaded(true)
    }

    if (onLoad) {
      onLoad()
    }
  }, [isLoaded, onLoad])

  // trigger image onLoad if the image is complete
  useEffect(() => {
    if (fullSizeUrl && !previewImageRef?.current?.complete) {
      setIsLoaded(false)
    }

    if (!isLoaded && previewImageRef && previewImageRef?.current?.complete) {
      handleOnLoad()
    }
  }, [previewSizeUrl, fullSizeUrl, previewImageRef?.current, isLoaded])

  return (
    <>
      <div className="image-wrap">
        <div className="relative">
          {onLoad ? (
            <div className="ant-image">
              {/*<img*/}
              {/*  ref={previewImageRef}*/}
              {/*  onLoad={handleOnLoad}*/}
              {/*  alt="result-antImage"*/}
              {/*  src={previewSizeUrl}*/}
              {/*  className="ant-image-img z-10"*/}
              {/*/>*/}

              {previewSizeUrl ? (
                <CdnImage
                  ref={previewImageRef}
                  fill
                  alt="result-nextImage"
                  src={previewSizeUrl}
                  // sizes="(max-width: 768px) 100vw, 33vw"
                  onLoad={handleOnLoad}
                  className="ant-image-img z-10"
                  style={{ objectFit: 'contain' }}
                />
              ) : null}
              {!isLoaded && (
                <div className="absolute inset-0 bg-opacity-95">
                  <LoadingPlaceholder />
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              {previewSizeUrl ? (
                <CdnImage
                  fill
                  alt="result-nextImage"
                  src={previewSizeUrl}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <LoadingPlaceholder />
              )}
            </div>
          )}
          {fullSizeUrl && !showPreview && <ImagePreviewMask />}
        </div>
      </div>
    </>
  )
}

export default NextImageResult
