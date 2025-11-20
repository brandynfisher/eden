import { Metadata } from 'next'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  params: Promise<{ agentId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { agentId } = await params
  return {
    manifest: `/manifest?agent=${agentId}`,
  }
}

export default async function RealtimeLayout({ children, params }: Props) {
  // Await params to ensure compatibility with Next.js 15
  await params
  return <>{children}</>
}
