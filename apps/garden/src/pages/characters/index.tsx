import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import CharactersPage from '@/pages/characters/CharactersPage'
import { Character as CharacterType } from '@edenlabs/eden-sdk'
import { NextPageContext } from 'next'

import { Page } from '../../../types/page'

interface PageProps {
  data: CharacterType[]
  error?: string
}

const fetchCharacters = async (context: NextPageContext) => {
  const { req } = context
  const userId = req ? req.session.address : ''
  const cookies = req ? req.headers.cookie : ''

  return fetcherFn(
    `${CONFIG.NEXT_PUBLIC_HOST}/api/characters/user?userId=${userId}`,
    { headers: { cookie: cookies } },
  )
}

export const getServerSideProps = getServerSidePropsBase(
  [
    {
      responseFieldName: 'characters',
      dataFetcher: fetchCharacters,
    },
  ],
  true,
)

const characters: Page<PageProps> = () => {
  return <CharactersPage />
}

export default characters
