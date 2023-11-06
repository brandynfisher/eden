import { truncatedAddress } from '@/lib/string'
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined'
import CopyOutlined from '@ant-design/icons/CopyOutlined'
import { Task } from '@edenlabs/eden-sdk'
import { useClipboard } from '@mantine/hooks'
import { CircularProgress } from '@mui/material'
import { App } from 'antd'
import React from 'react'

const TimelineItemFooter = ({
  task,
  progress,
}: {
  task: Task
  progress: number
}) => {
  const { message } = App.useApp()
  const { copied, copy } = useClipboard({ timeout: 750 })

  const handleCopyClick = async (taskId: string) => {
    await copy(taskId)

    message.destroy()
    message.success(`Copied Task ID to clipboard!`)
  }

  return (
    <div className="flex items-center justify-between gap-2 text-xs mt-2">
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center justify-center">
          <CircularProgress
            size="20px"
            thickness={5}
            variant="determinate"
            value={100}
            className={`absolute text-gray-300 dark:text-gray-800 ${
              task.status === 'failed'
                ? 'text-red-600 dark:text-red-700'
                : task.status === 'completed'
                ? 'text-green-600 dark:text-green-600'
                : ''
            }`}
          />
          <CircularProgress
            size="20px"
            thickness={10}
            variant="determinate"
            value={progress}
            color="info"
          />
        </div>
        <div className="capitalize text-gray-800 dark:text-gray-400">
          <strong>
            {task.status}
            {task.status === 'running' ? (
              <>
                <span className="mx-1">•</span>
                {progress}%
              </>
            ) : null}
          </strong>
        </div>
      </div>
      <div>
        <div
          className="flex items-center gap-2 cursor-copy"
          onClick={() => handleCopyClick(task.taskId)}
        >
          <div
            className="italic text-gray-800 dark:text-gray-400"
            title={task.taskId}
          >
            {truncatedAddress(task.taskId)}
          </div>
          {copied ? <CheckCircleOutlined /> : <CopyOutlined />}
        </div>
      </div>
    </div>
  )
}

export default TimelineItemFooter
