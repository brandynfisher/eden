import { Page } from '../../../../types/page'
import ChatSessionPage from '@/components/Pages/ChatSessionPage'
import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import { Session } from '@edenlabs/eden-sdk'
import { NextApiRequest, GetServerSidePropsContext } from 'next'

interface PageProps {
  data: Session
  error?: string
}

const fetchSession = async (context: GetServerSidePropsContext) => {
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
