import Chat from '@/features/chat_v2/chat'

type Props = {
  params: {
    agentId: string
    threadId: string
  }
}

const ChatAgentThreadPage = async ({
  params: { agentId, threadId },
}: Props) => {
  return <Chat agentId={agentId} threadId={threadId} />
}

export default ChatAgentThreadPage
