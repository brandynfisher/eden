'use client'

import LoadingIndicator from '@/components/LoadingIndicator'
import { Task } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'
import dynamic from 'next/dynamic'
import React from 'react'

const TaskDetail = dynamic(() => import('@/components/Tasks/TaskDetail'), {
  loading: () => <LoadingIndicator />,
})

const TaskDetailModal = ({ task, ...rest }: { task: Task }) => {
  return (
    <Modal {...rest}>
      <TaskDetail task={task} />
    </Modal>
  )
}

export default TaskDetailModal
