'use client'

import MyAssistantMessage from '@/features/chat/components/assistant-message'
import MyEditComposer from '@/features/chat/components/edit-composer'
import MyUserMessage from '@/features/chat/components/user-message'
import {
  Composer,
  Thread,
  ThreadConfig,
  ThreadPrimitive,
  ThreadWelcome,
  useThread,
} from '@assistant-ui/react'
import { FC } from 'react'

const ThreadFollowupSuggestions: FC = () => {
  const suggestions = useThread(t => t.suggestions)

  return (
    <ThreadPrimitive.If empty={false} running={false}>
      {suggestions && suggestions.length ? (
        <div className="aui-thread-followup-suggestions">
          {suggestions?.map((suggestion, idx) => (
            <ThreadPrimitive.Suggestion
              key={idx}
              className="aui-thread-followup-suggestion"
              prompt={suggestion.prompt}
              method="replace"
              autoSend
            >
              {suggestion.prompt}
            </ThreadPrimitive.Suggestion>
          ))}
        </div>
      ) : null}
    </ThreadPrimitive.If>
  )
}

const MyThread: FC<ThreadConfig> = config => {
  const {
    components: {
      Composer: ComposerComponent = Composer,
      ThreadWelcome: ThreadWelcomeComponent = ThreadWelcome,
    } = {},
  } = config

  return (
    <Thread.Root config={config}>
      <Thread.Viewport>
        <ThreadWelcomeComponent />
        <Thread.Messages
          components={{
            UserMessage: MyUserMessage,
            EditComposer: MyEditComposer,
            AssistantMessage: MyAssistantMessage,
          }}
        />
        <ThreadFollowupSuggestions />
        <Thread.ViewportFooter>
          <Thread.ScrollToBottom />
          <ComposerComponent />
        </Thread.ViewportFooter>
      </Thread.Viewport>
    </Thread.Root>
  )
}

export default MyThread
