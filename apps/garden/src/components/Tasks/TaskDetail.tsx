'use client'

import CodeBlock from '@/components/CodeBlock'
import TestGeneratorFinishButton from '@/components/Creation/CreationInterface/TestGeneratorFinishButton'
import { CONFIG } from '@/lib/config'
import { rightTruncatedString } from '@/lib/string'
import { timeAgo } from '@/lib/time'
import { CheckCircleOutlined, CopyOutlined } from '@ant-design/icons'
import { Task } from '@edenlabs/eden-sdk'
import { useClipboard } from '@mantine/hooks'
import { App, Collapse, Progress } from 'antd'
import React from 'react'

const { Panel } = Collapse
const TaskDetail = ({ task }: { task: Task }) => {
  const timeSinceTaskCreation = timeAgo(task.createdAt)

  const { message } = App.useApp()
  const { copied, copy } = useClipboard({ timeout: 750 })

  const handleCopyClick = async () => {
    await copy(task.taskId)

    message.destroy()
    message.success(`Copied Task ID to clipboard!`)
  }

  return (
    <>
      <h3>Task Details</h3>
      <Collapse expandIconPosition="start" defaultActiveKey={'1'}>
        <Panel key={'1'} header={'Status'}>
          <div className="flex gap-2">
            <div>Generator</div>
            <strong>/{task.generator.generatorName}</strong>
          </div>
          <div className="text-xs text-gray-800 dark:text-gray-400">
            <div className="flex justify-between items-center">
              <div
                className="flex gap-2 min-w-0 truncate mt-1 items-center cursor-copy"
                onClick={handleCopyClick}
              >
                <div>TaskId</div>
                <div className="text-xs text-gray-800 dark:text-gray-400 max-w-full truncate font-bold">
                  {task.taskId}
                </div>
                {copied ? <CheckCircleOutlined /> : <CopyOutlined />}
              </div>
            </div>
            <div className="flex gap-2">
              Status
              <div className="capitalize">
                <strong>{task?.status}</strong>
              </div>
            </div>

            <div className="flex gap-2">
              Cost
              <div className="capitalize">
                <strong>{task?.cost} Manna</strong>
              </div>
            </div>

            <div className="flex gap-2">
              Started
              <div>{timeSinceTaskCreation}</div>
            </div>
          </div>
          <Progress
            percent={task?.progress ? Math.round(task.progress * 100) : 0}
            status={task?.status === 'pending' ? 'normal' : 'active'}
            className="mt-1 flex items-center"
          />
          <div className="flex justify-between items-center">
            <div className="text-xs italic text-gray-800 dark:text-gray-400 truncate">
              {rightTruncatedString(task.config.text_input || '', 30)}
            </div>
            {CONFIG.DEV_TYPE === 'dummy' && (
              <TestGeneratorFinishButton taskId={task.taskId} />
            )}
          </div>
          {task.error && (
            <div>
              <div>Error Message</div>
              <div className="text-red-500 font-mono">{task.error}</div>
            </div>
          )}
        </Panel>
        <Panel key={'2'} header={'Raw JSON'}>
          <CodeBlock
            code={JSON.stringify(task, null, 2)}
            language="javascript"
          />
        </Panel>
      </Collapse>
    </>
  )
}

export default TaskDetail
