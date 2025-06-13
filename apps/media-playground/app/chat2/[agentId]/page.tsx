import SessionChat from '@/features/sessions/components/session-chat'

type Props = {
  params: {
    agentId: string
  }
}

const SessionChatAgentPage = async ({ params: { agentId } }: Props) => {
  return <SessionChat agentId={agentId} />
}

export default SessionChatAgentPage
