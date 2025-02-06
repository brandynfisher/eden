// import Chat from '@/features/chat_v2/chat'

type Props = {
  params: {
    agentId: string
  }
}

const ChatAgentPage = async ({ params: { agentId } }: Props) => {
  // return <Chat agentId={agentId} />
  return <div>soon {agentId}</div>
}

export default ChatAgentPage
