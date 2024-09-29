'use client'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import CustomThread from '@/features/chat/custom-thread'
import Sessions from '@/features/chat/sessions-list'
import { AssistantV2 } from '@/types/Assistant'

const Chat = () => {
  const assistant: AssistantV2 = {
    name: 'Eve',
    image: 'app/assistant/eve_512.png',
    welcomeText: 'What do you want to create today?',
  }

  return (
    <div className="h-[calc(100dvh_-_64px)]">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>
          <Sessions />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel>
          <CustomThread assistant={assistant} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default Chat
