import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import CharacterDetailPage from '@/pages/create/characters/[id]/CharacterDetailPage'
import { Character } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextPageContext } from 'next'

import { Page } from '../../../../../types/page'

interface PageProps {
  data: Character
  error?: string
}

const fetchCharacter = async (context: NextPageContext) => {
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
