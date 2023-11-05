import TimelineItem from '@/components/Creation/CreationInterface/Timeline/TimelineItem'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { Task } from '@edenlabs/eden-sdk'
import { Alert, Card, Empty } from 'antd'
import React, { RefObject, useContext } from 'react'

const TimelineListWrap = ({
  innerRef,
}: {
  innerRef: RefObject<HTMLDivElement>
}) => {
  const { tasks } = useContext(CreationNotificationContext)

  return (
    <div className="flex flex-col pb-[104px] md:pb-0" ref={innerRef}>
      {tasks && tasks.length ? (
        tasks.map((task, index) => (
          <TimelineList key={task._id} task={task} index={index} />
        ))
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="flex flex-col items-center">
              <div className="mb-4">No recent tasks found.</div>
            </div>
          }
        />
      )}
    </div>
  )
}

const TimelineList = ({ task, index }: { task: Task; index: number }) => {
  return (
    <div className="result-preview mb-4 relative w-full flex flex-col rounded-lg border-0 md:items-center">
      {index === 0 &&
      (task.status === 'pending' || task.status === 'running') ? (
        <Alert
          className={`w-full h-fit flex justify-center items-center md:max-w-[640px] mb-4 px-4 py-2 text-gray-500`}
          description="Tasks are being processed on our servers. You can keep using the app or close it."
        />
      ) : null}
      <Card
        className={`w-full h-fit flex justify-center items-center md:max-w-[640px]`}
      >
        <TimelineItem task={task} listIndex={index} />
      </Card>
    </div>
  )
}

export default TimelineListWrap
