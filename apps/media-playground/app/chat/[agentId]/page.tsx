import { redirect } from 'next/navigation'

type ChatRedirectPageProps = {
  params: {
    agentId: string
  }
}

export default function ChatRedirectPage({ params }: ChatRedirectPageProps) {
  redirect(`/chat?agent=${params.agentId}`)
}
