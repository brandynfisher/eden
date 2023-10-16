import { getAuthHeaders, getAuthUserId } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import ChatScenarioPage from '@/pages/scenarios/chat/ChatScenarioPage'
import { Character, Session } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextPageContext } from 'next'

import { Page } from '../../../../types/page'

interface PageProps {
  data: {
    characters: Character[]
    sessions: Session[]
  }
  error?: string
}

const fetchCharacters = async (context: NextPageContext) => {
  const { req } = context
  const userId = await getAuthUserId(req as NextApiRequest)

  return fetcherFn(
    `${CONFIG.NEXT_PUBLIC_HOST}/api/characters/user?userId=${userId}`,
    {
      headers: await getAuthHeaders(req as NextApiRequest),
    },
  )
}

const fetchSessions = async (context: NextPageContext) => {
  const { req } = context
  const userId = await getAuthUserId(req as NextApiRequest)

  return fetcherFn(
    `${CONFIG.NEXT_PUBLIC_HOST}/api/sessions/user?userId=${userId}`,
    {
      headers: await getAuthHeaders(req as NextApiRequest),
    },
  )
}

export const getServerSideProps = getServerSidePropsBase([
  {
    responseFieldName: 'characters',
    dataFetcher: fetchCharacters,
  },
  {
    responseFieldName: 'sessions',
    dataFetcher: fetchSessions,
  },
])

const chatScenario: Page<PageProps> = ({ data }: PageProps) => {
  return (
    <ChatScenarioPage
      data={{ characters: data.characters, sessions: data.sessions }}
    />
  )
}

export default chatScenario
