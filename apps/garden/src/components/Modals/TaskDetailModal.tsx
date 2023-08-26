'use client'

import { Task } from '@edenlabs/eden-sdk'
import { Modal } from 'antd'
import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'

const TaskDetailModal = ({ task, ...rest }: { task: Task }) => {
  const TaskDetail = dynamic(() => import('@/components/Tasks/TaskDetail'), {
    suspense: true,
  })

  return (
    <Modal {...rest}>
      <Suspense fallback={<div>Loading</div>}>
        <TaskDetail task={task} />
      </Suspense>
    </Modal>
  )
}

export default TaskDetailModal
