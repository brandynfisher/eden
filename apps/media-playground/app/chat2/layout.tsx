import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

const SessionChatLayout = ({ children }: Props) => {
  return <>{children}</>
}

export default SessionChatLayout
