import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import MonologueScenarioPage from '@/pages/scenarios/monologue/MonologueScenarioPage'
import { Character as CharacterType } from '@edenlabs/eden-sdk/dist/responses/CharactersResponses'
import { NextPageContext } from 'next'

import { Page } from '../../../../types/page'

interface PageProps {
  data: CharacterType[]
  error?: string
}

const fetchCharacters = async (context: NextPageContext) => {
  const userId = context?.req?.session.address

  return fetcherFn(
    `${CONFIG.NEXT_PUBLIC_HOST}/api/characters/user?userId=${userId}`,
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

const monologueScenario: Page<PageProps> = ({ data }: PageProps) => {
  return <MonologueScenarioPage data={data} />
}

export default monologueScenario
