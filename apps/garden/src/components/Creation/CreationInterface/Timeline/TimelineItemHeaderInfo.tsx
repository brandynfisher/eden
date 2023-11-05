import { timeAgo } from '@/lib/time'
import { Task } from '@edenlabs/eden-sdk'
import React from 'react'

const TimelineItemHeaderInfo = ({ task }: { task: Task }) => {
  return (
    <div className="flex items-center">
      <strong className=" text-sm dark:text-gray-200">
        /{task?.generator.generatorName}
      </strong>
      <span className=" text-gray-700 dark:text-gray-400 text-xs mx-1">•</span>
      <div
        className="text-gray-700 dark:text-gray-400 text-xs"
        title={timeAgo(task.createdAt)}
      >
        {timeAgo(task.createdAt)}
      </div>
      <span className="text-gray-700 dark:text-gray-400 text-xs mx-1">•</span>
      <div className="text-xs text-gray-800 dark:text-gray-400">
        {task.cost} Manna
      </div>
    </div>
  )
}

export default TimelineItemHeaderInfo
