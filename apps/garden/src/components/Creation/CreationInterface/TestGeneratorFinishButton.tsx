import { ForwardFilled } from '@ant-design/icons'
import { Task } from '@edenlabs/eden-sdk'
import { Button } from 'antd'
import axios from 'axios'

const TestGeneratorFinishButton = ({ taskId }: { taskId: Task['_id'] }) => {
  const handleFinish = async (taskId: string) => {
    await axios.post('/api/tasks/finish', {
      taskId,
    })
  }

  return (
    <Button
      onClick={() => handleFinish(taskId)}
      className="flex items-center justify-between"
    >
      <ForwardFilled />
    </Button>
  )
}

export default TestGeneratorFinishButton
