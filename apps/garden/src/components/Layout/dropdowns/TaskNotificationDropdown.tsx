import TestGeneratorFinishButton from '@/components/Creation/CreationInterface/TestGeneratorFinishButton'
import ImageResult from '@/components/Creation/CreationInterface/media/ImageResult'
import { CONFIG } from '@/lib/config'
import { getAspectRatio } from '@/lib/media'
import { rightTruncatedString, truncatedAddress } from '@/lib/string'
import { durationBetweenDates, timeAgo } from '@/lib/time'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { UserContext } from '@/providers/UserProvider'
import {
  CheckCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  CopyOutlined,
  ExclamationOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import { Task } from '@edenlabs/eden-sdk'
import { useClipboard } from '@mantine/hooks'
import { App, Button, Dropdown, Progress, Space, Spin } from 'antd'
import { ItemType } from 'antd/es/menu/hooks/useItems'
import { NextRouter, useRouter } from 'next/router'
import React, { useContext } from 'react'

const FailedTaskMenuItem = ({
  task,
  handleDismiss,
}: {
  task: Task
  handleDismiss: (taskId: string) => void
}) => {
  const taskRunDuration = durationBetweenDates(
    task.createdAt,
    task.updatedAt,
    true,
  )

  const { message } = App.useApp()
  const { copied, copy } = useClipboard({ timeout: 750 })

  const handleCopyClick = async () => {
    await copy(task.taskId)

    message.destroy()
    message.success(`Copied Task ID to clipboard!`)
  }

  return (
    <div key={task._id}>
      <div className="p-2 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded-md">
        <div
          className="flex w-full"
          style={{ minWidth: '240px', maxWidth: '320px' }}
        >
          <div className="flex items-center justify-between min-w-0 gap-2 w-full">
            <div className="flex flex-col min-w-0 w-full">
              <div className="flex justify-between items-center">
                <strong>/{task.generator.generatorName}</strong>
                <div
                  className="flex min-w-0 truncate mt-1 cursor-copy"
                  onClick={handleCopyClick}
                >
                  <div className="text-xs italic text-gray-800 dark:text-gray-400 truncate">
                    {truncatedAddress(task.taskId)}
                  </div>
                  {copied ? <CheckCircleOutlined /> : <CopyOutlined />}
                </div>
              </div>
              <div className="text-xs text-gray-800 dark:text-gray-400">
                Duration: {taskRunDuration}
              </div>
              <div className="flex min-w-0 truncate mt-1">
                <div className="text-xs italic text-red-500 truncate">
                  {task.error ? task.error : 'Unknown error'}
                </div>
              </div>
            </div>
            <Button type="text" title="Dismiss" className="px-2">
              <CloseOutlined
                className="ml-auto cursor-pointer"
                onClick={e => {
                  e.stopPropagation()
                  handleDismiss(task._id)
                }}
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const CompletedTaskMenuItem = ({
  router,
  task,
  handleDismiss,
}: {
  router: NextRouter
  task: Task
  handleDismiss: (taskId: string) => void
}) => {
  const creationId = task.creation?._id

  const handleViewCreation = async () => {
    if (!creationId) return
    await router.push(`/creations/${creationId}`)
  }

  const taskRunDuration = durationBetweenDates(
    task.createdAt,
    task.updatedAt,
    true,
  )

  if (!task.creation) return null

  return (
    <div key={task._id}>
      <div
        onClick={handleViewCreation}
        className="p-2 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded-md"
      >
        <div
          className="flex w-full"
          style={{ minWidth: '240px', maxWidth: '320px' }}
        >
          <div
            className="rounded-md w-12 h-12 mr-4 flex items-center overflow-hidden"
            style={{ minWidth: '48px', minHeight: '48px' }}
          >
            <ImageResult
              previewSizeUrl={task.creation?.thumbnail || ''}
              aspectRatio={getAspectRatio(
                task.creation?.mediaAttributes.width,
                task.creation?.mediaAttributes.height,
              )}
            />
          </div>
          <div className="flex items-center justify-between min-w-0 w-full">
            <div className="flex flex-col gap-2 min-w-0 w-full">
              <div className="flex justify-between items-center">
                <strong>/{task.generator.generatorName}</strong>
                <div className="text-xs text-gray-800 dark:text-gray-400 hidden xs:flex">
                  Took {taskRunDuration}
                </div>
              </div>
              <div className="flex min-w-0 truncate mt-1">
                <div className="text-xs text-gray-800 dark:text-gray-400 truncate">
                  {task.creation?.name}
                </div>
              </div>
            </div>
            <Button type="text" title="Dismiss" className="px-2">
              <CloseOutlined
                className="ml-auto cursor-pointer"
                onClick={e => {
                  e.stopPropagation()
                  handleDismiss(task._id)
                }}
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const PendingTaskMenuItem = ({ task }: { task: Task }) => {
  const timeSinceTaskCreation = timeAgo(task.createdAt)

  const { message } = App.useApp()
  const { copied, copy } = useClipboard({ timeout: 750 })

  const handleCopyClick = async (ev: React.MouseEvent<HTMLDivElement>) => {
    ev.preventDefault()
    ev.stopPropagation()
    await copy(task.taskId)

    message.destroy()
    message.success(`Copied Task ID to clipboard!`)
  }

  return (
    <div
      className="p-2 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
      style={{ minWidth: '240px' }}
      key={task._id}
    >
      <div className="flex justify-between items-center">
        <strong>/{task.generator.generatorName}</strong>
        <div
          className="flex gap-2 min-w-0 truncate mt-1 cursor-copy"
          onClick={handleCopyClick}
        >
          <div className="text-xs italic text-gray-800 dark:text-gray-400 truncate">
            {truncatedAddress(task.taskId)}
          </div>
          {copied ? <CheckCircleOutlined /> : <CopyOutlined />}
        </div>
      </div>
      <div className="text-xs italic text-gray-800 dark:text-gray-400 truncate">
        {rightTruncatedString(task.config.text_input || '', 36)}
      </div>
      <Progress
        percent={task?.progress ? Math.round(task.progress * 100) : 0}
        status={task?.status === 'pending' ? 'normal' : 'active'}
        className="mt-1 flex items-center"
      />
      <div className="text-xs text-gray-800 dark:text-gray-400 mb-1">
        <div className="flex justify-between">
          <div className="capitalize">
            <strong>{task?.status}</strong>
          </div>
          <div className="hidden xs:flex">Started {timeSinceTaskCreation}</div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-800 dark:text-gray-400">
          <strong>{task?.cost}</strong> Manna
        </div>
        {CONFIG.DEV_TYPE === 'dummy' && (
          <TestGeneratorFinishButton taskId={task.taskId} />
        )}
      </div>
      <div></div>
    </div>
  )
}

const TaskNotificationDropdown = ({ inDrawer }: { inDrawer?: boolean }) => {
  const router = useRouter()

  const { showModal } = useModalContext()

  const openDetailModal = async (task: Task) => {
    showModal(MODAL_TYPES.TASK_DETAIL_MODAL, { task })
  }

  const {
    pendingTasks,
    completedTasks,
    setCompletedTasks,
    failedTasks,
    setFailedTasks,
  } = useContext(CreationNotificationContext)

  const { refetch } = useContext(UserContext)

  const handleDismiss = async (
    taskId: string,
    items: Task[],
    setter: typeof setCompletedTasks | typeof setFailedTasks,
  ) => {
    if (!items || !setter) return
    const newTasks = items.filter(t => t._id !== taskId)
    setter(newTasks)
  }

  const handleDismissAll = async (
    items: Task[],
    setter: typeof setCompletedTasks | typeof setFailedTasks,
  ) => {
    if (!items || !setter) return
    setter([])
  }

  const pendingTaskItems: ItemType[] = pendingTasks
    ? pendingTasks.map(task => ({
        label: <PendingTaskMenuItem key={task._id} task={task} />,
        key: task._id,
        onClick: () => openDetailModal(task),
      }))
    : []

  const completedTaskItems = []
  if (completedTasks?.length) {
    completedTaskItems.push({
      label: (
        <div className="flex items-center justify-between">
          <div>Completed Tasks</div>
          <div className="flex justify-center text-xs">
            <Button
              size="small"
              className="font-mono text-xs !px-4"
              type="dashed"
              onClick={() =>
                handleDismissAll(completedTasks, setCompletedTasks)
              }
            >
              Dismiss all
            </Button>
          </div>
        </div>
      ),
      key: 0,
    })

    completedTaskItems.push(
      ...completedTasks.map(task => ({
        label: (
          <CompletedTaskMenuItem
            router={router}
            task={task}
            handleDismiss={() =>
              handleDismiss(task._id, completedTasks, setCompletedTasks)
            }
          />
        ),
        key: task._id,
      })),
    )
  }

  const failedTaskItems = []
  if (failedTasks?.length) {
    refetch.mannaBalance()

    failedTaskItems.push({
      label: (
        <div className="flex items-center justify-between">
          <div>Failed Tasks</div>
          <div className="flex justify-center text-xs">
            <Button
              size="small"
              className="font-mono text-xs !px-4"
              type="dashed"
              onClick={() => handleDismissAll(failedTasks, setFailedTasks)}
            >
              Dismiss all
            </Button>
          </div>
        </div>
      ),
      key: 0,
    })

    failedTaskItems.push(
      ...failedTasks.map(task => ({
        label: (
          <FailedTaskMenuItem
            task={task}
            handleDismiss={() =>
              handleDismiss(task._id, failedTasks, setFailedTasks)
            }
          />
        ),
        key: task._id,
        onClick: () => openDetailModal(task),
      })),
    )
  }

  if (
    !pendingTaskItems.length &&
    !completedTaskItems.length &&
    !failedTaskItems.length
  ) {
    return null
  }

  return (
    <Space
      className={`max-w-3xl ${
        inDrawer
          ? 'py-2 flex justify-between items-center !flex'
          : 'hidden sm:flex'
      }`}
    >
      <Button.Group className="flex items-center">
        {pendingTaskItems.length > 0 && (
          <Dropdown
            trigger={['click']}
            menu={{ items: pendingTaskItems }}
            arrow={true}
          >
            <Button
              type="text"
              className="font-mono text-grey-800 dark:text-gray-200 items-center flex px-2"
            >
              <Spin
                indicator={
                  <LoadingOutlined className="text-grey-800 dark:text-gray-200 mr-2" />
                }
              />
              {pendingTaskItems.length}
            </Button>
          </Dropdown>
        )}

        {failedTasks && failedTasks.length > 0 && (
          <Dropdown
            trigger={['click']}
            menu={{ items: failedTaskItems }}
            arrow={true}
          >
            <Button
              type="text"
              className="font-mono text-red-500 items-center flex px-2"
            >
              <ExclamationOutlined className="mr-2" />
              {failedTasks.length}
            </Button>
          </Dropdown>
        )}

        {completedTasks && completedTasks.length > 0 && (
          <Dropdown
            trigger={['click']}
            menu={{ items: completedTaskItems }}
            arrow={true}
          >
            <Button
              type="text"
              className="font-mono text-green-500 items-center flex px-2"
            >
              <CheckOutlined className="mr-2" />
              {completedTasks.length}
            </Button>
          </Dropdown>
        )}
      </Button.Group>
    </Space>
  )
}

export default TaskNotificationDropdown
