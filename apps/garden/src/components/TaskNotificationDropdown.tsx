import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { Task } from '@eden-labs/eden-sdk'
import { Dropdown, Menu, Space, Spin } from 'antd'
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
  const creationId = task.creation

  const handleViewCreation = () => {
    if (!creationId) return
    router.push(`/creations/${creationId}`)
  }

  return (
    <Menu.Item
      key={task._id}
      onClick={handleViewCreation}
      className="flex items-center"
    >
      <span className="mr-2">{task._id}</span>
      <CloseOutlined
        className="text-red-500 cursor-pointer"
        onClick={e => {
          e.stopPropagation()
          handleDismiss(task._id)
        }}
      />
    </Menu.Item>
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
    ? pendingTasks.map(task => <Menu.Item key={task._id}>{task._id}</Menu.Item>)
    : []

  const completedTaskItems = completedTasks
    ? completedTasks.map(task => CompletedTaskMenuItem({ task, handleDismiss }))
    : []

  return (
    <Space>
      {pendingTaskItems.length > 0 && (
        <Dropdown trigger={['click']} overlay={<Menu>{pendingTaskItems}</Menu>}>
          <div className="text-blue-500">
            <Space>
              <Spin />
              {pendingTaskItems.length}
            </Space>
          </div>
        </Dropdown>
      )}
      {completedTaskItems.length > 0 && (
        <Dropdown
          trigger={['click']}
          overlay={<Menu>{completedTaskItems}</Menu>}
        >
          <div className="text-green-500">
            <Space>
              <CheckOutlined />
              {completedTaskItems.length}
            </Space>
          </div>
        </Dropdown>
      )}
    </Space>
  )
}

export default TaskNotificationDropdown
