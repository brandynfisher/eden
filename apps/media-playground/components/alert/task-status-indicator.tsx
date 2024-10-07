'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useTaskStatus } from '@/providers/task-status-provider'
import { TaskV2, TaskV2Status } from '@edenlabs/eden-sdk'
import { ChevronDownIcon } from 'lucide-react'
import React, { useState } from 'react'

type IndicatorProps = {
  label: string
  count: number
  color: string
  tasks: TaskV2[]
}

const StatusIndicator = ({ label, count, color, tasks }: IndicatorProps) => {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center px-3 py-1 rounded-md cursor-pointer',
          color,
          'hover:bg-opacity-80 transition',
        )}
      >
        <span className="mr-1">{label}</span>
        <span className="bg-white text-black rounded-full px-2 py-0.5 text-xs">
          {count}
        </span>
        <ChevronDownIcon className="ml-1 h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="bg-white shadow-md rounded-md p-2 w-80">
        {tasks.length === 0 ? (
          <div className="text-gray-500">No tasks</div>
        ) : (
          tasks.map(task => (
            <DropdownMenuItem
              key={task._id}
              className="px-2 py-3 hover:bg-gray-100 rounded"
            >
              <div className="flex flex-col">
                <span className="font-semibold">{task.name}</span>
                <span className="text-sm text-gray-600">
                  {task.workflow || 'No workflow'}
                </span>
                <span className="text-xs text-gray-500">
                  Status: {task.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  Updated at: {new Date(task.updatedAt).toLocaleString()}
                </span>
                <div className="mt-2 flex space-x-2">
                  <button className="text-blue-500 hover:underline text-xs">
                    View Details
                  </button>
                  {task.status === TaskV2Status.Failed && (
                    <button className="text-green-500 hover:underline text-xs">
                      Retry
                    </button>
                  )}
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const TaskStatusIndicator = () => {
  const { pendingRunningTasks, failedTasks, completedTasks } = useTaskStatus()

  return (
    <div className="flex space-x-4">
      <StatusIndicator
        label="In Progress"
        count={pendingRunningTasks.length}
        color="bg-blue-500 text-white"
        tasks={pendingRunningTasks}
      />

      <StatusIndicator
        label="Failed"
        count={failedTasks.length}
        color="bg-red-500 text-white"
        tasks={failedTasks}
      />

      <StatusIndicator
        label="Completed"
        count={completedTasks.length}
        color="bg-green-500 text-white"
        tasks={completedTasks}
      />
    </div>
  )
}

export default TaskStatusIndicator
