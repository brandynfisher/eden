'use client'

import { MyThread } from '@/components/ui/assistant-ui/thread'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import type { FC, PropsWithChildren } from 'react'

export const MyAssistantSidebar: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel>{children}</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        <MyThread />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
