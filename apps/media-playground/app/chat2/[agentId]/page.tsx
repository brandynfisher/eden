import SessionChat from '@/features/session-chat/session-chat'

type Props = {
  params: {
    agentId: string
  }
}

const SessionChatAgentPage = async ({ params: { agentId } }: Props) => {
  return <SessionChat agentId={agentId} />
}

export default SessionChatAgentPage
