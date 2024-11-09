import { TooltipIconButton } from '@/components/ui/assistant-ui/tooltip-icon-button'
import { ActionBarPrimitive } from '@assistant-ui/react'
import { PencilIcon } from 'lucide-react'
import type { FC } from 'react'

const MyUserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="col-start-1 mr-3 mt-2.5 flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  )
}

export default MyUserActionBar
