import TestGeneratorFinishButton from '@/components/Creation/CreationInterface/TestGeneratorFinishButton'
import MenuDropdownMUI, {
  MenuDropdownItem,
} from '@/components/Layout/dropdowns/MenuDropdownMUI'
import { ResponsiveImage } from '@/components/Media/ResponsiveImage'
import { CONFIG } from '@/lib/config'
import { rightTruncatedString, truncatedAddress } from '@/lib/string'
import { durationBetweenDates } from '@/lib/time'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined'
import CloseOutlined from '@ant-design/icons/CloseOutlined'
import CopyOutlined from '@ant-design/icons/CopyOutlined'
import { Task } from '@edenlabs/eden-sdk'
import { useClipboard } from '@mantine/hooks'
import TaskAlt from '@mui/icons-material/TaskAlt'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { App, Button, Progress } from 'antd'
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
    <div className="w-full" key={task._id}>
      <div onClick={handleViewCreation} className="cursor-pointer rounded-md">
        <div
          className="flex gap-2 relative w-full"
          style={{ width: '265px', maxHeight: '58px' }}
        >
          <div
            className="rounded flex justify-center"
            style={{ minWidth: '58px', maxWidth: '64px', minHeight: '58px' }}
          >
            <ResponsiveImage
              sizes={'96px'}
              src={task.creation?.thumbnail}
              alt={task._id}
              aspectRatio={task.creation?.mediaAttributes.aspectRatio}
              className="max-w-full"
            />
          </div>
          <div className="flex items-center justify-between min-w-0 w-full gap-2">
            <div className="flex flex-col gap-2 min-w-0 w-full">
              <div className="flex justify-between items-center text-sm">
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
            <Button
              type="text"
              title="Dismiss"
              className="relative px-2 right-[-8px]"
            >
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
    <div className="w-full" key={task._id}>
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
      <div className="text-xs italic text-gray-800 dark:text-gray-400 truncate mt-1">
        {rightTruncatedString(task.config.text_input || '', 36)}
      </div>
      {task?.status === 'running' ? (
        <Progress
          percent={task?.progress ? Math.round(task.progress * 100) : 0}
          status="active"
          className="mt-1 flex items-center"
        />
      ) : null}
      <div className="text-xs text-gray-800 dark:text-gray-400 mt-2">
        <div className="flex justify-between">
          <div className="capitalize">
            <strong>{task?.status}</strong>
          </div>
          <div className="text-xs text-gray-800 dark:text-gray-400">
            <strong>{task?.cost}</strong> Manna
          </div>
        </div>
      </div>
      {CONFIG.DEV_TYPE === 'dummy' && (
        <TestGeneratorFinishButton taskId={task.taskId} />
      )}
    </div>
  )
}

const TaskNotificationDropdownMUI = () => {
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

  const pendingTaskItems: MenuDropdownItem[] = pendingTasks
    ? pendingTasks.map(task => ({
        render: <PendingTaskMenuItem key={task._id} task={task} />,
        key: task._id,
        onClick: () => openDetailModal(task),
      }))
    : []

  const completedTaskItems: MenuDropdownItem[] = []
  if (completedTasks?.length) {
    completedTaskItems.push({
      render: (
        <div className="flex items-center gap-2 justify-between w-full">
          <div>Completed Tasks</div>
          <div className="flex justify-between text-xs">
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
      key: '0',
    })

    completedTaskItems.push(
      ...completedTasks
        .filter(task => !!task.creation)
        .map(task => ({
          render: (
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

  const failedTaskItems: MenuDropdownItem[] = []
  if (failedTasks?.length) {
    failedTaskItems.push({
      render: (
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
      key: '0',
    })

    failedTaskItems.push(
      ...failedTasks.map(task => ({
        render: (
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
    <div className="flex justify-between items-center">
      {pendingTasks && pendingTasks.length ? (
        <MenuDropdownMUI
          buttonLabel={
            <div className="font-mono items-center flex">
              <span className="loading loading-ring loading-md mr-2"></span>
              {pendingTasks.length}
            </div>
          }
          menuItems={pendingTaskItems}
        />
      ) : null}

      {failedTasks && failedTasks.length ? (
        <MenuDropdownMUI
          buttonLabel={
            <div className="font-mono text-red-500 items-center flex">
              <WarningAmberIcon className="mr-2" />
              {failedTasks.length}
            </div>
          }
          menuItems={failedTaskItems}
        />
      ) : null}

      {completedTasks && completedTasks.length ? (
        <MenuDropdownMUI
          buttonLabel={
            <div className="font-mono text-green-500 items-center flex">
              <TaskAlt className="mr-2" />
              {completedTasks.length}
            </div>
          }
          menuItems={completedTaskItems}
        />
      ) : null}
    </div>
  )
}

export default TaskNotificationDropdownMUI
