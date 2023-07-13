import TestGeneratorFinishButton from '@/components/Creation/CreationInterface/TestGeneratorFinishButton'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { Card } from 'antd'
import React, { useContext } from 'react'

const TestGeneratorInterface = () => {
  const { pendingTasks, activeTaskId } = useContext(CreationNotificationContext)

  return (
    <Card className="w-full mt-4">
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
              <TestGeneratorFinishButton taskId={task.taskId} />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default TestGeneratorInterface
