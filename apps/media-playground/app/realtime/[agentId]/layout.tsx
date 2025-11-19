import { Metadata } from 'next'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  params: { agentId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    manifest: `/manifest?agent=${params.agentId}`,
  }
}

export default function RealtimeLayout({ children }: Props) {
  return <>{children}</>
}
