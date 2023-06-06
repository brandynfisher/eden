import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { CheckOutlined } from '@ant-design/icons'
import { Dropdown, Space, Spin } from 'antd'
import React, { useContext } from 'react'

const TaskNotificationMenu = () => {
  const { pendingTasks, completedTasks } = useContext(
    CreationNotificationContext,
  )
  const pendingTaskItems = pendingTasks
    ? pendingTasks.map(task => {
        return {
          label: task._id,
          key: task._id,
        }
      })
    : []

  const completedTaskItems = completedTasks
    ? completedTasks.map(task => {
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
      {completedTaskItems.length > 0 && (
        <>
          <Dropdown menu={{ items: completedTaskItems }} trigger={['click']}>
            <div className="text-green-500">
              <Space>
                <CheckOutlined />
                {completedTaskItems.length}
              </Space>
            </div>
          </Dropdown>
        </>
      )}
    </Space>
  )
}

export default TaskNotificationMenu
