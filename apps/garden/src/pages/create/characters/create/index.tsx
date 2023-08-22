import PageLayoutSidebar from '@/components/Layout/layouts/PageLayoutSidebar'
import CreateCharacterPage from '@/pages/create/characters/create/CreateCharacterPage'
import { ReactNode } from 'react'

const createCharacters = () => {
  return <CreateCharacterPage />
}

createCharacters.getLayout = function getLayout(page: ReactNode) {
  return <PageLayoutSidebar>{page}</PageLayoutSidebar>
}

export default createCharacters
