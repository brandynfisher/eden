import CharacterForm from '@/components/Characters/CharacterForm'
import Breadcrumbs from '@/components/Layout/navigation/Breadcrumbs'
import { useCharacter } from '@/hooks/useCharacter'
import {
  ExperimentOutlined,
  HomeOutlined,
  RobotOutlined,
} from '@ant-design/icons'
import { Character } from '@edenlabs/eden-sdk'
import { useRouter } from 'next/router'
import React, { createContext } from 'react'

interface ICharacterContext {
  character?: Character
}

export const CharacterContext = createContext<ICharacterContext>({
  character: undefined,
})

const CharacterDetailPage = () => {
  const router = useRouter()
  const { id: characterId } = router.query
  const { character } = useCharacter(characterId)

  const breadcrumbItems = [
    {
      path: '/',
      icon: <HomeOutlined />,
    },
    {
      path: '/create',
      title: 'Create',
      icon: <ExperimentOutlined />,
    },
    {
      path: '/create/characters',
      title: 'Characters',
      icon: <RobotOutlined />,
    },
    {
      title: `${character?.name}`,
    },
  ]

  return (
    <CharacterContext.Provider value={{ character }}>
      <Breadcrumbs items={breadcrumbItems} />

      <h2 className="mb-4">Character Details</h2>
      {character && <CharacterForm character={character} />}
    </CharacterContext.Provider>
  )
}

export default CharacterDetailPage
