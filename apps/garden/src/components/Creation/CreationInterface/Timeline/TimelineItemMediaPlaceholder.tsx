import ExperimentOutlined from '@ant-design/icons/ExperimentOutlined'
import { Task } from '@edenlabs/eden-sdk'
import React from 'react'

const ProgressCard = ({ task }: { task: Task }) => {
  return (
    <div
      className={`relative rounded-lg overflow-hidden ${
        task.status === 'running' ? 'border-trace' : ''
      }`}
      style={{ aspectRatio: task.config.width / task.config.height }}
    >
      <div className="flex flex-col h-full w-full bg-gray-200 dark:bg-gray-900">
        <div className="relative overflow-hidden bg-gray-200 dark:bg-gray-800 animate-pulse flex flex-col h-full w-full  justify-center items-center !bg-opacity-30">
          <ExperimentOutlined className="text-2xl text-gray-500" />
        </div>
      </div>
    </div>
  )
}

const TimelineItemMediaPlaceholder = ({
  task,
}: {
  task: Task
  progress: number
}) => {
  const nSamples = task?.config['n_samples']

  return (
    <div className="mb-2">
      {nSamples && nSamples > 1 ? (
        <div
          className={`grid grid-cols-2 gap-2 2xl:grid-cols-${nSamples.length}`}
        >
          {new Array(nSamples).fill('').map((id, index) => (
            <ProgressCard key={`${task._id}_${index}_${id}`} task={task} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1">
          <ProgressCard task={task} />
        </div>
      )}
    </div>
  )
}
export default TimelineItemMediaPlaceholder
