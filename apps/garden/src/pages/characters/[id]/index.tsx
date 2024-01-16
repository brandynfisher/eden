import { Page } from '../../../../types/page'
import { CharacterHeadTags } from '@/components/HeadTags'
import { getAuthHeaders } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import CharacterPage from '@/pages/characters/[id]/CharacterPage'
import { Character as CharacterType } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextPageContext } from 'next'

interface PageProps {
  data: {
    character: CharacterType
  }
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

const Character: Page<PageProps> = ({ data }: PageProps) => {
  return (
    <>
      <CharacterHeadTags character={data.character} />
      <CharacterPage data={data.character} />
    </>
  )
}

export default Character
