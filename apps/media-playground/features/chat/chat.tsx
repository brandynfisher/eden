'use client'

import { MarkdownText } from '@/components/ui/assistant-ui/markdown-text'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import Thread from '@/features/chat/components/thread'
import MyThreadWelcome from '@/features/chat/components/thread-welcome'
import { ToolFallback } from '@/features/chat/components/tools/tool-fallback'
import { WebsearchTool } from '@/features/chat/components/tools/websearch-tool'
import SessionsList from '@/features/chat/sessions-list'
import { getCloudfrontOriginalUrl } from '@/lib/media'
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
          <Thread
            components={{
              ThreadWelcome: MyThreadWelcome,
            }}
            welcome={{
              suggestions: [
                {
                  prompt: 'Sugg 1',
                },
                {
                  prompt: 'Sugg 2',
                },
                {
                  prompt: 'Sugg 3',
                },
              ],
              message: assistant.welcomeText,
            }}
            assistantAvatar={{
              src: getCloudfrontOriginalUrl(assistant.image),
              fallback: assistant.name,
              alt: assistant.name,
            }}
            assistantMessage={{
              allowSpeak: false,
              components: {
                Text: MarkdownText,
                ToolFallback,
              },
            }}
            tools={[WebsearchTool]}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default Chat
