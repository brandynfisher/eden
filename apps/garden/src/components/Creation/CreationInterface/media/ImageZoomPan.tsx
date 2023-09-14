import {
  FullscreenOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons'
import { Button } from 'antd'
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

  const onEscHandler = useCallback(
    (ev: KeyboardEvent) => {
      // console.log('esc handler executed', ev)
      if (ev.key === 'Escape') {
        // console.log('stop propagation', ev)
        ev.stopImmediatePropagation()
        ev.stopPropagation()
        onCloseHandler()
      }
    },
    [onCloseHandler, imageUrl],
  )

  useEffect(() => {
    if (imageUrl) {
      document?.addEventListener('keydown', onEscHandler, false)
    }

    return () => {
      document?.removeEventListener('keydown', onEscHandler, false)
    }
  }, [onEscHandler, imageUrl])

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
              <Button type="text" onClick={() => onCloseHandler()}>
                Close (ESC)
              </Button>
            </div>
            <TransformComponent wrapperClass="!w-full !h-full">
              <img
                ref={contentRef}
                src={imageUrl}
                alt={imageUrl}
                onLoad={() => {
                  centerView(fitContentToWrapper())
                }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  )
}

export default ImageZoomPan
