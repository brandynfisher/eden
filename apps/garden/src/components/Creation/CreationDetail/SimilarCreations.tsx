import CreationMasonry from '@/components/Creation/CreationMasonry'
import { LoadingOutlined } from '@ant-design/icons'
import { Creation } from '@edenlabs/eden-sdk'
import { useIntersection, useResizeObserver } from '@mantine/hooks'
import { Divider } from 'antd'
import React, { RefObject, useEffect, useState } from 'react'

const SimilarCreations = ({
  creation,
  containerRef,
  isModal,
}: {
  creation: Creation
  containerRef: RefObject<HTMLElement>
  isModal?: boolean
}) => {
  const [ref, rect] = useResizeObserver()
  const { ref: intersectionTargetRef, entry: intersectionObserver } =
    useIntersection({
      rootMargin: '0px',
      threshold: 1,
    })
  const [shouldLoadSimilar, setShouldLoadSimilar] = useState(false)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    if (shouldLoadSimilar) {
      return
    }

    if (rect.height === 0) {
      return
    }

    const windowHeight = intersectionObserver?.rootBounds?.height || 0
    const isVisibleOnInitialRender =
      containerRef?.current.getBoundingClientRect().height -
        containerRef?.current.offsetTop <
      windowHeight

    // modal disables body scroll and has its own scrollable container thus needs to handled differently
    if (isModal && isVisibleOnInitialRender) {
      setShouldLoadSimilar(true)
      return
    }

    if (intersectionObserver && intersectionObserver?.isIntersecting) {
      const hasWindowScrolled =
        containerRef.current.getBoundingClientRect().top < 0

      if (hasWindowScrolled || isVisibleOnInitialRender) {
        setShouldLoadSimilar(true)
      }
    }
  }, [
    isModal,
    containerRef,
    rect,
    intersectionObserver?.isIntersecting,
    shouldLoadSimilar,
  ])

  return (
    <div className="w-full mx-auto md:max-w-[640px] lg:mx-0 lg:max-w-full">
      <Divider className="mt-4 lg:mt-16 lg:mb-8" />
      <h3 className="mb-8">Similar Creations</h3>

      <div ref={ref} className="min-h-[16vh]">
        {!shouldLoadSimilar ? (
          <div className="flex !mt-0 pt-8 pb-16 justify-center">
            <LoadingOutlined className="text-4xl" ref={intersectionTargetRef} />
          </div>
        ) : (
          <CreationMasonry
            wrapperSizeRect={rect}
            query={{ creationId: creation._id }}
          />
        )}
      </div>
    </div>
  )
}

export default SimilarCreations
