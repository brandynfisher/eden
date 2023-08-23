'use client'

import CreationCard from '@/components/Creation/CreationCard/CreationCard'
import { UserContext } from '@/providers/UserProvider'
import { Creation } from '@edenlabs/eden-sdk'
import { useViewportSize } from '@mantine/hooks'
import { useResizeObserver as useResizeObserverMantine } from '@mantine/hooks'
import { Empty } from 'antd'
import {
  MasonryScroller,
  useContainerPosition,
  usePositioner,
  useResizeObserver,
} from 'masonic'
import React, { useContext, useRef } from 'react'

const CreationMasonry = ({ creations }: { creations: Creation[] | null }) => {
  const containerRef = useRef(null)
  const { settings } = useContext(UserContext)

  const [ref, rect] = useResizeObserverMantine()
  const { width: windowWidth, height: windowHeight } = useViewportSize()
  const { offset, width } = useContainerPosition(containerRef, [
    windowWidth,
    windowHeight,
    rect,
  ])

  const positioner = usePositioner(
    {
      width,
      columnGutter: 12,
      columnCount:
        settings?.maxGridCols.value && settings.maxGridCols.value !== 'auto'
          ? settings.maxGridCols.value
          : undefined,
      maxColumnCount:
        settings?.maxGridCols.value && settings.maxGridCols.value !== 'auto'
          ? settings.maxGridCols.value
          : settings?.maxGridCols.params.initialValue,
    },
    [creations?.length, width],
  )
  const resizeObserver = useResizeObserver(positioner)

  return (
    <div ref={ref}>
      {creations ? (
        <>
          {creations.length && typeof creations[0] === 'undefined' ? (
            <div>error fetching list</div>
          ) : (
            <MasonryScroller
              style={{ outline: 'none' }}
              positioner={positioner}
              resizeObserver={resizeObserver}
              containerRef={containerRef}
              items={creations}
              height={windowHeight}
              offset={offset}
              overscanBy={1}
              itemHeightEstimate={300}
              render={CreationCard}
              itemKey={data => data._id}
            />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="flex flex-col items-center">
                <div className="mb-4">Nothing here yet.</div>
              </div>
            }
          />
        </div>
      )}
    </div>
  )
}

export default CreationMasonry
