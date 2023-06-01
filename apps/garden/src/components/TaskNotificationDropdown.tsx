import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { CheckOutlined } from '@ant-design/icons'
import { Dropdown, Space, Spin } from 'antd'
import React, { useContext } from 'react'

const TaskNotificationMenu = () => {
  const { tasks } = useContext(CreationNotificationContext)
  const pendingTasks = tasks
    ? tasks
        .filter(task => task.status === 'pending')
        .map(task => {
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
      {pendingTasks.length > 0 && (
        <>
          <Dropdown menu={{ items: pendingTasks }} trigger={['click']}>
            <div className="text-blue-500">
              <Space>
                <Spin />
                {pendingTasks.length}
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
