import FullscreenOutlined from '@ant-design/icons/FullscreenOutlined'
import ZoomInOutlined from '@ant-design/icons/ZoomInOutlined'
import ZoomOutOutlined from '@ant-design/icons/ZoomOutOutlined'
import { Button } from 'antd'
import Image from 'next/image'
import React, { useCallback, useEffect, useRef } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'

const ImageZoomPan = ({
  imageUrl,
  onCloseHandler,
}: {
  imageUrl: string
  onCloseHandler: () => void
}) => {
  const componentWrapRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const onEscHandler = (key: string) => {
      if (key === 'Escape') {
        onCloseHandler()
      }
    }

    if (imageUrl) {
      document.addEventListener('keydown', ev => onEscHandler(ev.key), false)
    } else {
      document.removeEventListener('keydown', ev => onEscHandler(ev.key), false)
    }
  }, [onCloseHandler])

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

  const onEscHandler = useCallback(
    (ev: React.KeyboardEvent<HTMLDivElement>) => {
      if (ev.key === 'Escape') {
        ev.stopPropagation()
        onCloseHandler()
      }
    },
    [onCloseHandler],
  )

  useEffect(() => {
    contentRef.current?.focus()
  }, [])

  return (
    <div ref={componentWrapRef} className={`fixed inset-0 bg-black z-30`}>
      <TransformWrapper
        minScale={0.025}
        maxScale={2}
        centerZoomedOut={false}
        // centerOnInit={true}
        // initialPositionY={componentWrapRef.current?.clientHeight}
        // initialPositionX={componentWrapRef.current?.clientWidth}
      >
        {({ zoomIn, zoomOut, centerView }) => (
          <>
            <div className="absolute tools z-30 flex gap-2 p-2 bg-gray-400 bg-opacity-40 dark:bg-gray-950 dark:bg-opacity-40 rounded-bl-lg right-0">
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
              <Button type="text" onClick={() => onCloseHandler()}>
                Close (ESC)
              </Button>
            </div>
            <TransformComponent wrapperClass="!w-full !h-full justify-center items-center">
              <div
                ref={contentRef}
                tabIndex={0}
                onKeyDown={ev => onEscHandler(ev)}
                className="outline-0 relative"
              >
                <Image
                  key={imageUrl}
                  src={imageUrl}
                  alt={imageUrl}
                  sizes={'100vw'}
                  onLoadingComplete={() => centerView(fitContentToWrapper())}
                  width="0"
                  height="0"
                  className="w-full h-full text-center"
                  style={{ objectPosition: 'center center' }}
                />
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  )
}

export default ImageZoomPan
