import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { CheckOutlined } from '@ant-design/icons'
import { Dropdown, Space, Spin } from 'antd'
import React, { useContext } from 'react'

const TaskNotificationMenu = () => {
  const { tasks, pendingTasks } = useContext(CreationNotificationContext)
  const pendingTaskItems = pendingTasks
    ? pendingTasks.map(task => {
        return {
          label: task._id,
          key: task._id,
        }
      })
    : []

  const completedTasks = tasks
    ? tasks
        .filter(task => task.status === 'completed')
        .map(task => {
          return {
            label: task._id,
            key: task._id,
          }
        })
    : []

  return (
    <Space>
      {pendingTaskItems.length > 0 && (
        <>
          <Dropdown menu={{ items: pendingTaskItems }} trigger={['click']}>
            <div className="text-blue-500">
              <Space>
                <Spin />
                {pendingTaskItems.length}
              </Space>
            </div>
          </Dropdown>
        </>
      )}
      {completedTasks.length > 0 && (
        <>
          <Dropdown menu={{ items: completedTasks }} trigger={['click']}>
            <div className="text-green-500">
              <Space>
                <CheckOutlined />
                {completedTasks.length}
              </Space>
            </div>
          </Dropdown>
        </>
      )}
    </Space>
  )
}

export default TaskNotificationMenu
