import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { getServerSidePropsBase } from '@/lib/ssr'
import DialogueScenarioPage from '@/pages/scenarios/dialogue/DialogueScenarioPage'
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

const dialogueScenario: Page<PageProps> = ({ data }: PageProps) => {
  return <DialogueScenarioPage data={data} />
}

export default dialogueScenario
