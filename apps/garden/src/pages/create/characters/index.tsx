import { Page } from '../../../../types/page'
import MyCharactersPage from '@/components/Pages/MyCharactersPage'
import { getAuthHeaders, getAuthUserId } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import { Character as CharacterType } from '@edenlabs/eden-sdk'
import { NextApiRequest, NextPageContext } from 'next'

interface PageProps {
  data: CharacterType[]
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

export const getServerSideProps = getServerSidePropsBase([
  {
    responseFieldName: 'characters',
    dataFetcher: fetchCharacters,
  },
])

const createCharacters: Page<PageProps> = ({ data }: PageProps) => {
  return <MyCharactersPage data={data} />
}

export default createCharacters
