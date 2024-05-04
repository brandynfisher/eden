import TimelineItem from '@/components/Creation/CreationInterface/Timeline/TimelineItem'
import { Task } from '@edenlabs/eden-sdk'
import { useElementSize } from '@mantine/hooks'
import { Alert, Card, Divider, Empty } from 'antd'
import { useMasonry, UseMasonryOptions, usePositioner, useResizeObserver } from 'masonic'
import { useScroller } from 'mini-virtual-list'
import React, { FC, RefObject, useContext } from 'react'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'

const TimelineListItem = ({ data, index }: { data: Task; index: number }) => {
  return (
    <div className='result-preview mb-2 md:mb-4 relative w-full flex flex-col rounded-lg border-0 md:items-center'>
      {index === 0 &&
      (data.status === 'pending' || data.status === 'running') ? (
        <Alert
          className={`w-full h-fit flex justify-center items-center md:max-w-[640px] 3xl:max-w-[840px] mb-4 px-4 py-2 text-gray-500`}
          description='Your tasks are being processed and will appear here and on your profile once complete. It is safe to close this window.'
        />
      ) : null}
      <Card
        className={`w-full h-fit flex justify-center items-center md:max-w-[640px] 3xl:max-w-[840px] compact-card`}
      >
        <TimelineItem task={data} listIndex={index} />
      </Card>
      <Divider className='mt-2 mb-0 md:hidden' />
    </div>
  )
}

const MasonryHookWrap: FC<UseMasonryOptions<Task>> = props => {
  return <div>{useMasonry(props)}</div>
}

const TimelineList = ({
  innerRef,
}: {
  innerRef: RefObject<HTMLDivElement>
}) => {
  const {
    tasks,
    pendingTasks,
    completedTasks,
    failedTasks,
  } = useContext(CreationNotificationContext)

  const {
    ref: containerRef,
    width: containerWidth,
    height: containerHeight,
  } = useElementSize()

  const { scrollTop, isScrolling } = useScroller(containerRef, { offset: 30 })

  const positioner = usePositioner(
    {
      width: containerWidth,
      rowGutter: 0,
      maxColumnCount: 1,
      columnCount: 1,
    },
    [tasks?.length, pendingTasks?.length, completedTasks?.length, failedTasks?.length, containerWidth],
  )

  const resizeObserver = useResizeObserver(positioner)

  return (
    <div
      data-testid='creation-workspace-timeline'
      className='flex flex-col max-h-[calc(100vh_-_72px)] pb-[105px] w-full overflow-hidden md:pb-0'
      ref={innerRef}
    >
      {!tasks?.length && (
        <div className='flex flex-col items-center'>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className='flex flex-col items-center'>
                <div className='mb-4'>Nothing here yet.</div>
              </div>
            }
          />
        </div>
      )}
      {tasks?.length && typeof tasks[0] !== 'undefined' ? (
        <div
          ref={containerRef}
          className='h-[calc(100%_-_72px)] md:h-full mx-auto mb-0 w-full pr-3 overflow-y-scroll overflow-x-hidden'
        >
          <MasonryHookWrap
            key={tasks[0].updatedAt}
            positioner={positioner}
            resizeObserver={resizeObserver}
            items={tasks}
            itemHeightEstimate={500}
            itemKey={(item, _index) => item?._id ?? _index}
            height={containerHeight}
            scrollTop={scrollTop}
            isScrolling={isScrolling}
            overscanBy={3}
            render={TimelineListItem}
            // onRender={maybeLoadMoreTasks}
          />
        </div>
      ) : null}
    </div>
  )
}

export default TimelineList
