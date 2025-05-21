'use client'

import Session from '@/features/sessions/session'
import { SessionContentMessage, SessionV2 } from '@edenlabs/eden-sdk'
import { useEffect, useState } from 'react'

type Props = {
  params: {
    id: string
  }
}

export default function SessionPage({ params }: Props) {
  const [sessionData, setSessionData] = useState<SessionV2 | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        console.log('Fetching session:', params.id)
        const response = await fetch(`/api/sessions/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch session')
        }
        const data = await response.json()
        console.log('Session data:', data)
        setSessionData(data)
      } catch (err) {
        console.error('Error fetching session:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    }

    fetchSession()
  }, [params.id])

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  if (!sessionData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  const messages = sessionData.messages.map(msg => ({
    ...msg,
    createdAt: new Date(msg.createdAt ?? ''),
  }))

  return (
    <Session
      id={sessionData._id}
      title={sessionData.title ?? 'Untitled'}
      messages={messages as SessionContentMessage[]}
    />
  )
}
