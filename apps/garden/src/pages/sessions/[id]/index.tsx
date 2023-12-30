import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import ChatSessionPage from '@/pages/sessions/[id]/ChatSessionPage'
import { Session } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextPageContext } from 'next'

import { Page } from '../../../../types/page'

interface PageProps {
  data: Session
  error?: string
}

const fetchSession = async (context: NextPageContext) => {
  const { req, query } = context
  const id = query.id ? String(query.id).trim() : false

  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/sessions/${id}`, {
    headers: await getAuthHeaders(req as NextApiRequest),
  })
}

export const getServerSideProps = getServerSidePropsBase([
  {
    responseFieldName: 'session',
    dataFetcher: fetchSession,
  },
])

const ChatSession: Page<PageProps> = ({ data }: PageProps) => {
  return <ChatSessionPage data={data} />
}

export default ChatSession
