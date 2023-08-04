import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import ChatSessionPage from '@/pages/scenarios/chat/[id]/ChatSessionPage'
import { Character, Session } from '@edenlabs/eden-sdk'
import { NextPageContext } from 'next'
import { useRouter } from 'next/router'

import { Page } from '../../../../../types/page'

interface PageProps {
  data: {
    characters: Character[]
    sessions: Session[]
  }
  error?: string
}

const fetchCharacters = async (context: NextPageContext) => {
  const userId = context?.req?.session.address

  return fetcherFn(
    `${CONFIG.NEXT_PUBLIC_HOST}/api/characters/user?userId=${userId}`,
  )
}
const fetchSessions = async (context: NextPageContext) => {
  const userId = context?.req?.session.address

  return fetcherFn(
    `${CONFIG.NEXT_PUBLIC_HOST}/api/sessions/user?userId=${userId}`,
  )
}

export const getServerSideProps = getServerSidePropsBase(
  [
    {
      responseFieldName: 'characters',
      dataFetcher: fetchCharacters,
    },
    {
      responseFieldName: 'sessions',
      dataFetcher: fetchSessions,
    },
  ],
  true,
)

const ChatSession: Page<PageProps> = ({ data }: PageProps) => {
  const router = useRouter()
  const { query } = router
  const id = query.id ? String(query.id).trim() : undefined

  return (
    <ChatSessionPage
      data={{ characters: data.characters, sessions: data.sessions }}
      activeSessionId={id}
    />
  )
}

export default ChatSession
