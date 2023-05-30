import { Button } from 'antd'
import axios from 'axios'
import React from 'react'

function TaskButton() {
  const createTaskHandler = async () => {
    await axios.post('/api/tasks/create', {
      generatorName: 'create',
      config: {},
    })
  }
  return <Button onClick={createTaskHandler}>Create Task</Button>
}

export default TaskButton
