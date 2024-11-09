'use client'

import { TooltipIconButton } from '@/components/ui/assistant-ui/tooltip-icon-button'
import { ThreadPrimitive } from '@assistant-ui/react'
import { ArrowDownIcon } from 'lucide-react'
import type { FC } from 'react'

const MyThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="absolute -top-8 rounded-full disabled:invisible"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  )
}
export default MyThreadScrollToBottom
