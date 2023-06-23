import ImageResult from '@/components/CreationInterface/media/ImageResult'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import {
  CheckOutlined,
  CloseOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import { Task } from '@eden-labs/eden-sdk'
import { Button, Dropdown, Menu, Space, Spin } from 'antd'
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
  const [generatorName, prompt] = Object.entries(task.config).filter(
    item => item[0] !== 'seed',
  )[0] as [string, string]

  const handleViewCreation = () => {
    if (!creationId) return
    router.push(`/creations/${creationId}`)
  }

  return (
    <>
      <Menu.Divider />
      <div
        onClick={handleViewCreation}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded-md"
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
              <div>
                <strong>/{generatorName}</strong>
              </div>
              <div className="flex min-w-0 truncate">
                <div className="text-xs italic text-gray-800 dark:text-gray-400 truncate">
                  {prompt}
                </div>
              </div>
            </div>
            <CloseOutlined
              className="ml-auto text-red-500 cursor-pointer"
              onClick={e => {
                e.stopPropagation()
                handleDismiss(task._id)
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}

const PendingTaskMenuItem = ({ task }: { task: Task }) => {
  const [generatorName, prompt] = Object.entries(task.config).filter(
    item => item[0] !== 'seed',
  )[0] as [string, string]

  return (
    <>
      <Menu.Divider />
      <div
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded-md"
        style={{ minWidth: '240px' }}
      >
        <div>
          <strong>/{generatorName}</strong>
        </div>
        <div className="text-xs italic text-gray-800 dark:text-gray-400 truncate">
          {prompt}
        </div>
      </div>
    </>
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

  const pendingTaskItems = pendingTasks
    ? pendingTasks.map(task => (
        <PendingTaskMenuItem key={task._id} task={task} />
      ))
    : []

  const completedTaskItems = completedTasks
    ? completedTasks.map(task => CompletedTaskMenuItem({ task, handleDismiss }))
    : []

  return (
    <Space className="max-w-3xl">
      {pendingTaskItems.length > 0 && (
        <Dropdown
          trigger={['hover', 'click']}
          overlay={
            <Menu className="max-w-xs">
              <div className="px-2">Pending Tasks</div>
              {pendingTaskItems}
            </Menu>
          }
        >
          <Button
            type="text"
            className="text-grey-800 dark:text-gray-200 items-center flex"
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
          trigger={['hover', 'click']}
          overlay={
            <Menu className="max-w-xs">
              <div className="px-2">Completed Tasks</div>
              {completedTaskItems}
            </Menu>
          }
        >
          <Button type="text" className="text-green-500 items-center flex">
            <CheckOutlined className="mr-2" />
            {completedTaskItems.length}
          </Button>
        </Dropdown>
      )}
    </Space>
  )
}

export default TaskNotificationDropdown
