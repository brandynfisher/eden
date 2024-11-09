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
import type { FC } from 'react'

const ThreadFollowupSuggestions: FC = () => {
  const suggestions = useThread(t => t.suggestions)

  return (
    <ThreadPrimitive.If empty={false} running={false}>
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
    // <ThreadPrimitive.Root className='bg-background h-full'>
    //   <ThreadPrimitive.Viewport
    //     className='flex h-full flex-col items-center overflow-y-scroll scroll-smooth bg-inherit px-4 pt-8'>
    //     <MyThreadWelcome />
    //     <ThreadPrimitive.Messages
    //       components={{
    //         UserMessage: MyUserMessage,
    //         EditComposer: MyEditComposer,
    //         AssistantMessage: MyAssistantMessage,
    //       }}
    //     />
    //
    //     <div className='min-h-8 flex-grow' />
    //
    //     <div
    //       className='sticky bottom-0 mt-3 flex w-full max-w-2xl flex-col items-center justify-end rounded-t-lg bg-inherit pb-4'
    //     >
    //       <ThreadPrimitive.Empty>
    //         <div className="flex flex-wrap w-full gap-4 mb-4">
    //           <ThreadSuggestion prompt={'List all tools you have access to'}>
    //             What can you do?
    //           </ThreadSuggestion>
    //           <ThreadSuggestion prompt={'Create an image of a penguin using flux-schnell.'}>
    //             Create an image of a penguin
    //           </ThreadSuggestion>
    //         </div>
    //       </ThreadPrimitive.Empty>
    //
    //       <MyThreadScrollToBottom />
    //       <MyComposer />
    //     </div>
    //   </ThreadPrimitive.Viewport>
    // </ThreadPrimitive.Root>

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
