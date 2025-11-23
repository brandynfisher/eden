'use client'

import ChatLaunchpad from '@/features/sessions/components/chat-launchpad'
import { Suspense } from 'react'

const ChatPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ChatLaunchpad />
    </Suspense>
  )
}

export default ChatPage
