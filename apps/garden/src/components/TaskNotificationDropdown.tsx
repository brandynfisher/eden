import ImageResult from '@/components/CreationInterface/media/ImageResult'
import { durationBetweenDates, durationSinceDate } from '@/lib/time'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import {
  CheckOutlined,
  CloseOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import { Task } from '@eden-labs/eden-sdk'
import { Button, Dropdown, Menu, Progress, Space, Spin } from 'antd'
import { ItemType } from 'antd/es/menu/hooks/useItems'
import { useRouter } from 'next/router'
import React, { useContext } from 'react'

const CompletedTaskMenuItem = ({
  task,
  handleDismiss,
}: {
  task: Task
  handleDismiss: (taskId: string) => void
}) => {
  const router = useRouter()
  const creationId = task.creation._id

  const handleViewCreation = () => {
    if (!creationId) return
    router.push(`/creations/${creationId}`)
  }

  const taskRunDuration = durationBetweenDates(
    task.createdAt,
    task.updatedAt,
    'seconds',
    true,
  )

  return (
    <div>
      <div
        onClick={handleViewCreation}
        className="p-2 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded-md"
      >
        <div
          className="flex w-full"
          style={{ minWidth: '240px', maxWidth: '320px' }}
        >
          <div
            className="rounded-md w-12 h-12 mr-4 flex items-center overflow-hidden"
            style={{ minWidth: '48px', minHeight: '48px' }}
          >
            <ImageResult resultUrl={task.creation.thumbnail} />
          </div>
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col min-w-0 mr-2">
              <div className="flex justify-between items-center">
                <strong>/{task.generator.generatorName}</strong>
                <div className="text-xs text-gray-800 dark:text-gray-400">
                  Took {taskRunDuration}
                </div>
              </div>
              <div className="flex min-w-0 truncate mt-1">
                <div className="text-xs text-gray-800 dark:text-gray-400 truncate">
                  {task._id}
                </div>
              </div>
            </div>
            <Button type="text" title="Dismiss" className="px-2">
              <CloseOutlined
                className="ml-auto cursor-pointer"
                onClick={e => {
                  e.stopPropagation()
                  handleDismiss(task._id)
                }}
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const PendingTaskMenuItem = ({ task }: { task: Task }) => {
  const timeSinceTaskCreation = durationSinceDate(task.createdAt)

  return (
    <div
      className="p-2 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded-md"
      style={{ minWidth: '240px' }}
    >
      <div className="flex justify-between items-center">
        <strong>/{task.generator.generatorName}</strong>
        <div className="text-xs text-gray-800 dark:text-gray-400">
          Started {timeSinceTaskCreation}
        </div>
      </div>
      <Progress
        percent={task.progress}
        status="active"
        className="mt-1 flex items-center"
      />
      <div className="text-xs italic text-gray-800 dark:text-gray-400 truncate">
        {task._id}
      </div>
    </div>
  )
}

const TaskNotificationDropdown = () => {
  const { pendingTasks, completedTasks, setCompletedTasks } = useContext(
    CreationNotificationContext,
  )

  const handleDismiss = async (taskId: string) => {
    if (!completedTasks || !setCompletedTasks) return
    const newCompletedTasks = completedTasks.filter(t => t._id !== taskId)
    setCompletedTasks(newCompletedTasks)
  }

  const pendingTaskItems: ItemType[] = pendingTasks
    ? pendingTasks.map(task => ({
        label: <PendingTaskMenuItem key={task._id} task={task} />,
        key: task._id,
      }))
    : []

  const completedTaskItems = completedTasks
    ? completedTasks.map(task => CompletedTaskMenuItem({ task, handleDismiss }))
    : []

  return (
    <Space className="max-w-3xl">
      {pendingTaskItems.length > 0 && (
        <Dropdown trigger={['click']} menu={{ items: pendingTaskItems }}>
          <Button
            type="text"
            className="text-grey-800 dark:text-gray-200 items-center flex px-2"
          >
            <Spin
              indicator={
                <LoadingOutlined className="text-grey-800 dark:text-gray-200 mr-2" />
              }
            />
            {pendingTaskItems.length}
          </Button>
        </Dropdown>
      )}
      {completedTaskItems.length > 0 && (
        <Dropdown
          trigger={['click']}
          overlay={
            <Menu className="max-w-xs">
              <div className="p-2">Completed Tasks</div>
              {completedTaskItems}
            </Menu>
          }
        >
          <Button type="text" className="text-green-500 items-center flex px-2">
            <CheckOutlined className="mr-2" />
            {completedTaskItems.length}
          </Button>
        </Dropdown>
      )}
    </Space>
  )
}

export default TaskNotificationDropdown
