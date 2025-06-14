import SessionChat from '@/features/sessions/components/session-chat'

type Props = {
  params: {
    agentId: string
  }
  resetKey?: number
}

const SessionChatAgentPage = async ({
  params: { agentId },
  resetKey,
}: Props) => {
  return <SessionChat agentId={agentId} resetKey={resetKey} />
}

export default SessionChatAgentPage
