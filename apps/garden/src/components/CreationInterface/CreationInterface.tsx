import GeneratorSelect from '@/components/CreationInterface/GeneratorSelect'
import { useGenerators } from '@/hooks/useGenerators'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { Button, Space } from 'antd'
import axios from 'axios'
import React, { useContext } from 'react'

const CreationInterface = () => {
  const { taskIds, setTaskIds, tasks, refetchPendingTasks } = useContext(
    CreationNotificationContext,
  )
  const { generators } = useGenerators()
  const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null)
  const pendingTasks = tasks?.filter(task => task.status === 'pending')

  const handleCreate = async () => {
    const response = await axios.post('/api/tasks/create', {
      generatorName: 'test',
    })
    const { taskId } = response.data
    setActiveTaskId(taskId)
    setTaskIds && setTaskIds([...taskIds, taskId])
    refetchPendingTasks && refetchPendingTasks()
  }

  const handleFinish = async (taskId: string) => {
    await axios.post('/api/tasks/finish', {
      taskId,
    })
  }

  return (
    <>
      <div>Creation Interface</div>
      {generators && <GeneratorSelect generators={generators} />}
      {activeTaskId && <div>Active Task: {activeTaskId}</div>}
      <Space direction="vertical">
        <Button onClick={handleCreate}>Create</Button>
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
    </>
  )
}

export default CreationInterface
