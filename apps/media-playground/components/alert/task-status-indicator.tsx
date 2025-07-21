'use client'

import AlertDestructive from '@/components/alert/alert-destructive'
import { AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthState } from '@/hooks/use-auth-state'
import customImageLoader from '@/image-loader'
import { useNotificationContext } from '@/providers/notification-provider'
import { useTaskStatus } from '@/providers/task-status-provider'
import {
  NotificationPriority,
  NotificationType,
  TaskV2Status,
} from '@edenlabs/eden-sdk'
import {
  AlertCircleIcon,
  BanIcon,
  BellIcon,
  CheckIcon,
  CircleCheckIcon,
  ExternalLinkIcon,
  InboxIcon,
  InfoIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react'
import { useTimeAgo } from 'next-timeago'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'

const TaskStatusIndicator = () => {
  const { isSignedIn } = useAuthState()
  const {
    allTasks,
    pendingRunningTasks,
    failedTasks,
    completedTasks,
    cancelledTasks,
  } = useTaskStatus()
  const { notifications, unreadCount, markAsRead, archiveNotifications } =
    useNotificationContext()
  const [open, setOpen] = useState(false)
  const { TimeAgo } = useTimeAgo()

  const getNotificationIcon = (
    type: NotificationType,
    priority: NotificationPriority,
  ) => {
    const iconClass = 'mr-1.5 h-4 w-4'

    switch (type) {
      case 'trigger_complete':
        return <CircleCheckIcon className={`${iconClass} text-green-500`} />
      case 'trigger_failed':
        return <TriangleAlertIcon className={`${iconClass} text-red-500`} />
      case 'session_complete':
        return <CircleCheckIcon className={`${iconClass} text-blue-500`} />
      case 'session_failed':
        return <AlertCircleIcon className={`${iconClass} text-red-500`} />
      case 'system_alert':
        return priority === 'high' || priority === 'urgent' ? (
          <TriangleAlertIcon className={`${iconClass} text-orange-500`} />
        ) : (
          <InfoIcon className={`${iconClass} text-blue-500`} />
        )
      default:
        return <BellIcon className={`${iconClass} text-gray-500`} />
    }
  }

  const handleMarkAsRead = async (notificationIds: string[]) => {
    await markAsRead(notificationIds)
  }

  const handleArchive = async (notificationIds: string[]) => {
    await archiveNotifications(notificationIds)
  }

  const handleMarkAllAsRead = async () => {
    await markAsRead()
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger title="View recent tasks and notifications" asChild>
        <Button
          variant="ghost"
          className="flex px-2 gap-2 focus:!ring-0 relative"
        >
          {(!pendingRunningTasks || !pendingRunningTasks.length) &&
          (!completedTasks || !completedTasks.length) &&
          (!notifications || !notifications.length) ? (
            <div className="flex items-center">
              <InboxIcon className="mr-1 h-4 w-4" />0
            </div>
          ) : (
            <>
              {pendingRunningTasks && pendingRunningTasks.length ? (
                <div className="flex items-center text-blue-500">
                  <span className={'mr-1 h-5 w-5 loading loading-ring'} />
                  <span className="text-sm">{pendingRunningTasks.length}</span>
                </div>
              ) : null}
              {completedTasks && completedTasks.length ? (
                <div className="flex items-center text-green-500">
                  <CircleCheckIcon className="mr-1 h-4 w-4" />
                  <span className="text-sm">{completedTasks.length}</span>
                </div>
              ) : null}
              {notifications && notifications.length ? (
                <div className="flex items-center text-purple-500">
                  <BellIcon className="mr-1 h-4 w-4" />
                  <span className="text-sm">{notifications.length}</span>
                </div>
              ) : null}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="bg-popover shadow-md rounded-md w-80">
        <DropdownMenuItem className="cursor-pointer group" asChild>
          <Link
            href={'/create/image/flux_schnell'}
            prefetch={false}
            className="text-sm px-2 py-1"
          >
            <div className="flex w-full justify-between items-center gap-2">
              <div className=" flex gap-1 items-center">
                <div className="group-hover:underline">View all Tasks</div>
                <ExternalLinkIcon className="ml-1 h-4 w-4" />
              </div>
              <div className="px-2 py-1">
                <div className="flex space-x-2 justify-between">
                  {pendingRunningTasks && pendingRunningTasks.length ? (
                    <div className="flex text-blue-500 items-center">
                      <span className={'mr-1.5 h-4 w-4 loading loading-ring'} />
                      <span className="text-xs">
                        {pendingRunningTasks.length}
                      </span>
                    </div>
                  ) : null}
                  {completedTasks && completedTasks.length ? (
                    <div className="flex text-green-500 items-center">
                      <CircleCheckIcon className="mr-1.5 h-4 w-4" />
                      <span className="text-xs">{completedTasks.length}</span>
                    </div>
                  ) : null}
                  {failedTasks && failedTasks.length ? (
                    <div className="flex text-red-500 items-center">
                      <TriangleAlertIcon className="mr-1.5 h-4 w-4" />
                      <span className="text-xs">{failedTasks.length}</span>
                    </div>
                  ) : null}
                  {cancelledTasks && cancelledTasks.length ? (
                    <div className="flex text-yellow-500 items-center">
                      <BanIcon className="mr-1.5 h-4 w-4" />
                      <span className="text-xs">{cancelledTasks.length}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="overflow-y-auto overflow-x-hidden max-h-[calc(100dvh_-_240px)] md:max-h-[calc(100dvh_-_120px)]">
          {/* Notifications Section */}
          {notifications && notifications.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs px-2 py-1 h-6"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
              {notifications.map(notification => (
                <div key={notification._id}>
                  <DropdownMenuItem
                    className="px-2 py-2 hover:bg-muted rounded cursor-pointer"
                    asChild
                  >
                    {notification.action_url ? (
                      <Link
                        href={`${process.env.NEXT_PUBLIC_HOST || ''}${
                          notification.action_url
                        }`}
                        prefetch={false}
                        className="w-full"
                      >
                        <div className="flex flex-col w-full">
                          <div className="flex items-center gap-2 mb-1">
                            {getNotificationIcon(
                              notification.type,
                              notification.priority,
                            )}
                            <div className="text-xs text-accent-foreground">
                              {notification.title}
                            </div>
                            <div
                              className="text-xs text-muted-foreground/50 ml-auto"
                              title={new Date(
                                notification.createdAt,
                              ).toLocaleString()}
                            >
                              <TimeAgo
                                date={notification.createdAt}
                                locale="en-short"
                              />
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={e => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleMarkAsRead([notification._id])
                                  }}
                                  className="h-6 w-6 p-0"
                                  title="Mark as read"
                                >
                                  <CheckIcon className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={e => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleArchive([notification._id])
                                }}
                                className="h-6 w-6 p-0"
                                title="Dismiss"
                              >
                                <XIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs line-clamp-2 text-muted-foreground">
                            {notification.message}
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="w-full">
                        <div className="flex flex-col w-full">
                          <div className="flex items-center gap-2 mb-1">
                            {getNotificationIcon(
                              notification.type,
                              notification.priority,
                            )}
                            <div className="text-xs text-accent-foreground">
                              {notification.title}
                            </div>
                            <div
                              className="text-xs text-muted-foreground/50 ml-auto"
                              title={new Date(
                                notification.createdAt,
                              ).toLocaleString()}
                            >
                              <TimeAgo
                                date={notification.createdAt}
                                locale="en-short"
                              />
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={e => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleMarkAsRead([notification._id])
                                  }}
                                  className="h-6 w-6 p-0"
                                  title="Mark as read"
                                >
                                  <CheckIcon className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={e => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleArchive([notification._id])
                                }}
                                className="h-6 w-6 p-0"
                                title="Dismiss"
                              >
                                <XIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs line-clamp-2 text-muted-foreground">
                            {notification.message}
                          </div>
                        </div>
                      </div>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>
              ))}
            </>
          )}

          {/* Tasks Section */}
          {allTasks.length > 0 && (
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
              Tasks
            </div>
          )}

          {allTasks.length === 0 &&
          (!notifications || notifications.length === 0) ? (
            <DropdownMenuItem className="px-2 py-3 bg-muted/20 text-muted-foreground/50 hover:bg-muted rounded cursor-pointer">
              No recent activity
            </DropdownMenuItem>
          ) : (
            allTasks.map(task => (
              <div key={task._id}>
                <DropdownMenuItem
                  className="px-2 py-2 hover:bg-muted rounded cursor-pointer"
                  asChild
                >
                  <Link
                    href={`/create/${task.output_type}/${task.tool}`}
                    prefetch={false}
                  >
                    <div className="flex flex-col w-full">
                      <div className="flex items-center gap-2 mb-1">
                        {task.status === null ||
                        task.status === TaskV2Status.Running ||
                        task.status === TaskV2Status.Pending ? (
                          <span
                            className={
                              'text-blue-500 mr-1 h-5 w-5 loading loading-ring'
                            }
                          />
                        ) : null}
                        {task.status === TaskV2Status.Completed ? (
                          <CircleCheckIcon className="text-green-500 h-4 w-4" />
                        ) : null}
                        {task.status === TaskV2Status.Cancelled ? (
                          <BanIcon className="text-yellow-500 h-4 w-4" />
                        ) : null}
                        {task.status === TaskV2Status.Failed ? (
                          <TriangleAlertIcon className="text-red-500 h-4 w-4" />
                        ) : null}
                        <div className="text-xs text-accent-foreground">
                          {task.tool || 'No tool'}
                        </div>
                        <div
                          className="text-xs text-muted-foreground/50 ml-auto"
                          title={new Date(task.createdAt).toLocaleString()}
                        >
                          <TimeAgo date={task.createdAt} locale="en-short" />
                        </div>
                      </div>
                      <div className={'h-10 flex gap-2 items-center relative'}>
                        {task.status === TaskV2Status.Completed
                          ? task.result.map((result, resultIndex) =>
                              result.output && Array.isArray(result.output) ? (
                                result.output.map((output, index) => (
                                  <Image
                                    key={`${task._id}_${index}_${output.filename}`}
                                    className="flex-shrink-0 max-h-8 w-8 rounded-md object-cover"
                                    loader={customImageLoader}
                                    src={output.filename || ''}
                                    alt={task.args.prompt || ''}
                                    width={48}
                                    height={48}
                                  />
                                ))
                              ) : (
                                <AlertDestructive key={resultIndex}>
                                  <AlertDescription className="p-1 text-xs">
                                    Item: {task?._id}
                                  </AlertDescription>
                                </AlertDestructive>
                              ),
                            )
                          : null}
                        <div className="text-xs line-clamp-2 text-muted-foreground">
                          {task.args?.prompt || '-'}
                        </div>
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default TaskStatusIndicator
