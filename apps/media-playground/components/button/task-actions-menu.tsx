import ActionsDropdown from '@/components/button/actions-dropdown'
import DownloadActionItem from '@/components/button/download-action-item'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { generateFilename } from '@/utils/slug.util'
import { TaskV2, TaskV2Result } from '@edenlabs/eden-sdk'
import { FileSlidersIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  task: TaskV2
  result?: TaskV2Result
  index?: number
  className?: string
}

const TaskActionsMenu = ({ task, result, index, className }: Props) => {
  return (
    <ActionsDropdown className={className}>
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link
            href={`/create/${task.output_type}/${task.tool}?task=${task._id}`}
            scroll={false}
            shallow={true}
          >
            <FileSlidersIcon className="mr-2 h-4 w-4" />
            Use as Preset
            {/*<DropdownMenuShortcut>⇧⌘U</DropdownMenuShortcut>*/}
          </Link>
        </DropdownMenuItem>
        {result ? (
          <DownloadActionItem
            type={'creation'}
            originalFileUrl={result.url || ''}
            saveAsFileName={generateFilename(
              task.user.username,
              task.args.prompt?.substring(0, 64).trim(),
              task._id,
              index,
            )}
          />
        ) : null}
      </DropdownMenuGroup>
    </ActionsDropdown>
  )
}

export default TaskActionsMenu
