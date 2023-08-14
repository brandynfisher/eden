import MediaDisplay from '@/components/MediaDisplay'
import { getModalUrls } from '@/lib/modal'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Card, Progress, Spin } from 'antd'
import { useRouter } from 'next/router'
import React, { useContext } from 'react'

const ResultPreview = () => {
  const router = useRouter()

  const { hasChangedGenerator, pendingTasks, completedTasks, activeTaskId } =
    useContext(CreationNotificationContext)

  const activeTask = pendingTasks?.find(task => task.taskId === activeTaskId)
  const completedTask = completedTasks?.find(
    task => task.taskId === activeTaskId,
  )

  const { pageUrl, modalUrl } = getModalUrls(
    router,
    'creation',
    completedTask && completedTask.creation ? completedTask.creation._id : '',
  )
  const { showModal } = useModalContext()

  const openDetailModal = async () => {
    await router.push(pageUrl, modalUrl, { scroll: false, shallow: true })
    showModal(MODAL_TYPES.CREATION_DETAIL_MODAL, {
      creation:
        completedTask && completedTask.creation ? completedTask.creation : {},
    })
  }

  const creationUri =
    completedTask && completedTask.creation ? completedTask.creation.uri : false

  if (hasChangedGenerator || (!activeTask && !completedTask)) return null

  return (
    <div className="relative flex flex-col space-y-4 col-span-12 lg:mt-9 lg:col-span-6 rounded-lg border border-0 border-solid ">
      <Card
        className={`lg:sticky lg:top-4 w-full min-h-[512px] h-fit flex justify-center items-center`}
      >
        <div className="flex justify-center items-center">
          {!creationUri ? (
            <div className="text-center m-1">
              <Spin size="large" />
              <div className="text-gray-500 mt-6">Awaiting creation... </div>
              <Progress
                percent={
                  activeTask?.progress
                    ? Math.round(activeTask.progress * 100)
                    : 0
                }
                status="active"
                className="mt-4 flex items-center"
              />
            </div>
          ) : (
            <div onClick={openDetailModal}>
              <MediaDisplay creationUri={creationUri} />
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default ResultPreview
