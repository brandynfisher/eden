import { Page } from '../../../../../types/page'
import CharacterDetailPage from '@/components/Pages/CharacterDetailPage'
import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import { Character } from '@edenlabs/eden-sdk'
import { NextApiRequest, GetServerSidePropsContext } from 'next'

interface PageProps {
  data: Character
  error?: string
}

const fetchCharacter = async (context: GetServerSidePropsContext) => {
  const { req, query } = context
  const id = query.id ? String(query.id).trim() : false

  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/characters/${id}`, {
    headers: await getAuthHeaders(req as NextApiRequest),
  })
}

export const getServerSideProps = getServerSidePropsBase([
  {
    responseFieldName: 'character',
    dataFetcher: fetchCharacter,
  },
])

const characterDetail: Page<PageProps> = ({ data }: PageProps) => {
  return <CharacterDetailPage data={data} />
}

export default characterDetail
