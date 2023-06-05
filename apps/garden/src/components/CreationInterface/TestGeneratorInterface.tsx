import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { Button, Space } from 'antd'
import axios from 'axios'
import React, { useContext } from 'react'

const TestGeneratorInterface = () => {
  const { pendingTasks, activeTaskId } = useContext(CreationNotificationContext)

  const handleFinish = async (taskId: string) => {
    await axios.post('/api/tasks/finish', {
      taskId,
    })
  }
  return (
    <div>
      {activeTaskId && <div>Active Task: {activeTaskId}</div>}
      <Space direction="vertical">
        {pendingTasks &&
          pendingTasks.map(task => (
            <div key={task.taskId}>
              {task.taskId}
              <Button onClick={() => handleFinish(task.taskId)}>
                Finish Creation
              </Button>
            </div>
          ))}
      </Space>
    </div>
  )
}

export default TestGeneratorInterface
