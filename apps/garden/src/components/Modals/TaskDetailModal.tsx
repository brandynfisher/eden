'use client'

import LoadingIndicator from '@/components/LoadingIndicator'
import { Task } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'
import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'

const TaskDetail = dynamic(() => import('@/components/Tasks/TaskDetail'), {
  loading: () => <LoadingIndicator />,
})

const TaskDetailModal = ({ task, ...rest }: { task: Task }) => {
  return (
    <Modal {...rest}>
      <Suspense fallback={<div>Loading</div>}>
        <TaskDetail task={task} />
      </Suspense>
    </Modal>
  )
}

export default TaskDetailModal
