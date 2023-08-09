import {
  ExpandOutlined,
  ExperimentOutlined,
  FullscreenOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons'
import { Button, Image, Skeleton } from 'antd'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'

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
      className="flex !min-h-[300px] image-loading-placeholder bg-gray-400 dark:bg-black bg-opacity-90"
    >
      <ExperimentOutlined className="text-2xl" />
    </Skeleton.Node>
  )
}

const ImageResult = ({
  resultUrl,
  previewUrl,
  showPreview,
  onPreviewClose,
  onLoad,
}: {
  resultUrl: string
  previewUrl?: string
  showPreview?: boolean
  onPreviewClose?: () => void
  onLoad?: () => void
}) => {
  const onCloseHandler = useCallback(
    (ev?: React.MouseEvent | React.KeyboardEvent | undefined) => {
      if (ev) {
        ev.stopPropagation()
      }
      if (onPreviewClose) {
        onPreviewClose()
      }
    },
    [onPreviewClose],
  )

  useEffect(() => {
    if (!onPreviewClose) {
      return
    }

    const onEscHandler = (key: string) => {
      if (key === 'Escape') {
        onCloseHandler()
      }
    }

    if (showPreview) {
      document.addEventListener('keydown', ev => onEscHandler(ev.key), false)
    } else {
      document.removeEventListener('keydown', ev => onEscHandler(ev.key), false)
    }
  }, [showPreview, onPreviewClose, onCloseHandler])

  const [isLoaded, setIsLoaded] = useState(false)
  const componentWrapRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLImageElement>(null)
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
    if (previewUrl && !previewImageRef?.current?.complete) {
      setIsLoaded(false)
    }

    if (!isLoaded && previewImageRef && previewImageRef?.current?.complete) {
      handleOnLoad()
    }
  }, [previewUrl, previewImageRef?.current, isLoaded])

  const fitContentToWrapper = useCallback(() => {
    if (componentWrapRef.current && contentRef.current) {
      const wrapperWidth = componentWrapRef.current.clientWidth
      const wrapperHeight = componentWrapRef.current.clientHeight

      const contentWidth = contentRef.current.clientWidth
      const contentHeight = contentRef.current.clientHeight

      const widthScale = wrapperWidth / contentWidth
      const heightScale = wrapperHeight / contentHeight

      const scale = widthScale < heightScale ? widthScale : heightScale

      return scale
    }
  }, [contentRef, componentWrapRef])

  return (
    <>
      <div className="image-wrap">
        <div className="relative">
          {onLoad ? (
            <div className="ant-image">
              <img
                ref={previewImageRef}
                onLoad={handleOnLoad}
                alt="result"
                src={resultUrl}
                className="ant-image-img"
              />
              {!isLoaded && (
                <div className="absolute inset-0 z-10">
                  <LoadingPlaceholder />
                </div>
              )}
            </div>
          ) : (
            <Image
              placeholder={<LoadingPlaceholder />}
              alt="result"
              fallback="placeholder.png"
              preview={false}
              src={resultUrl}
            />
          )}
          {previewUrl && !showPreview && <ImagePreviewMask />}
        </div>

        {previewUrl && showPreview ? (
          <div ref={componentWrapRef} className={`fixed inset-0 bg-black z-10`}>
            <TransformWrapper
              minScale={0.1}
              maxScale={4}
              centerZoomedOut={false}
              centerOnInit={true}
            >
              {({ zoomIn, zoomOut, centerView }) => (
                <>
                  <div className="absolute tools z-20 flex gap-2 p-2 bg-gray-400 bg-opacity-40 dark:bg-gray-950 dark:bg-opacity-40 rounded-bl-lg right-0">
                    <Button.Group>
                      <Button type="text" onClick={() => zoomIn()}>
                        <ZoomInOutlined className="text-xl" />
                      </Button>
                      <Button type="text" onClick={() => zoomOut()}>
                        <ZoomOutOutlined className="text-xl" />
                      </Button>
                    </Button.Group>
                    <Button
                      type="text"
                      onClick={() => centerView(fitContentToWrapper())}
                    >
                      <FullscreenOutlined className="text-xl" />
                    </Button>
                    <Button type="text" onClick={ev => onCloseHandler(ev)}>
                      Close (ESC)
                    </Button>
                  </div>
                  <TransformComponent wrapperClass="!w-full !h-full">
                    <img
                      ref={contentRef}
                      src={previewUrl}
                      alt={previewUrl}
                      onLoad={() => {
                        centerView(fitContentToWrapper())
                      }}
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>
        ) : null}
      </div>
    </>
  )
}

export default ImageResult
