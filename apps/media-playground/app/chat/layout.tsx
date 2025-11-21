'use client'

import { LiveAudioProvider } from '@/features/sessions/live-audio'
import { PropsWithChildren } from 'react'

const Chat2Layout = ({ children }: PropsWithChildren) => {
  return <LiveAudioProvider>{children}</LiveAudioProvider>
}

export default Chat2Layout
