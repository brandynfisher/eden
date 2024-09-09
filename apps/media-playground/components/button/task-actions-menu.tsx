import ActionsDropdown from '@/components/button/actions-dropdown'
import DownloadActionItem from '@/components/button/download-action-item'
import { DropdownMenuGroup } from '@/components/ui/dropdown-menu'
import { TaskV2, TaskV2Result } from '@edenlabs/eden-sdk'
import React from 'react'

type Props = {
  task: TaskV2
  result: TaskV2Result
  index: number
  className?: string
}

const TaskActionsMenu = ({ task, result, index, className }: Props) => {
  return (
    <ActionsDropdown className={className}>
      <DropdownMenuGroup>
        <DownloadActionItem
          type={'creation'}
          originalFileUrl={result.url || ''}
          saveAsFileName={`${task.user.username || ''}${
            task.args.prompt
              ? `_${task.args.prompt
                  .substring(0, 64)
                  .trim()
                  .replace(/\s+/g, '-')}`
              : ``
          }_${task._id}_${index}`}
        />
      </DropdownMenuGroup>
    </ActionsDropdown>
  )
}

export default TaskActionsMenu
