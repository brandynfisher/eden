'use client'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import CustomThread from '@/features/chat/custom-thread'
import SessionsList from '@/features/chat/sessions-list'
import { AssistantV2 } from '@/types/Assistant'

const Chat = () => {
  const assistant: AssistantV2 = {
    name: 'Eve',
    image: 'app/assistant/eve_512.png',
    welcomeText: 'What do you want to create today?',
  }

  return (
    <div className="h-[calc(100dvh_-_64px)]">
      <ResizablePanelGroup
        direction="horizontal"
        className="!flex-col md:!flex-row"
      >
        <ResizablePanel
          defaultSize={20}
          minSize={10}
          className="!basis-auto md:!basis-0"
        >
          <SessionsList />
        </ResizablePanel>

        <ResizableHandle withHandle className="hidden md:flex" />

        <ResizablePanel
          defaultSize={75}
          minSize={25}
          className="!basis-auto md:!basis-0"
        >
          <CustomThread assistant={assistant} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default Chat
