import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { Button, Card } from 'antd'
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
    <Card>
      <div className="mb-4"> [dev only]</div>
      {activeTaskId && (
        <div className="mb-4">
          <div className="font-bold mb-2">Active Task:</div>
          <div>{activeTaskId}</div>
        </div>
      )}
      {pendingTasks && (
        <div>
          <div className="font-bold">Pending Tasks:</div>
          {pendingTasks.map(task => (
            <div
              className="flex justify-between items-center"
              key={task.taskId}
            >
              {task.taskId}
              <Button onClick={() => handleFinish(task.taskId)}>
                Finish Creation
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default TestGeneratorInterface
