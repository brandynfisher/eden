import Chat from '@/features/chat/chat'

type Props = {
  params: {
    agentId: string
  }
}

const ChatAgentPage = async ({ params: { agentId } }: Props) => {
  return <Chat agentId={agentId} defaultTab="settings" />
}

export default ChatAgentPage
