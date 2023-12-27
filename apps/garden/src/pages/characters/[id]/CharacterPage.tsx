import CharacterProfileHeader from '@/components/Characters/CharacterProfileHeader'
import { OrderByLatest } from '@/components/Layout/buttons/OrderByButtons'
import MasonryInfiniteContainer from '@/components/Masonry/MasonryInfiniteContainer'
import { useCharacter } from '@/hooks/useCharacter'
import { CONFIG } from '@/lib/config'
import { Character } from '@edenlabs/eden-sdk'
import { Tabs } from 'antd'
import Head from 'next/head'
import React from 'react'

const CreationTabContent = ({ characterId }: { characterId: string }) => {
  return (
    <div className="mt-4">
      <MasonryInfiniteContainer
        key={`creations_${characterId}`}
        itemType="creation"
        query={{ characterId: characterId }}
        filters={[OrderByLatest]}
      />
    </div>
  )
}

const CharacterPageContent = ({ character }: { character: Character }) => {
  const creatorPageTabs = [
    {
      label: 'Creations',
      key: 'creations',
      children: <CreationTabContent characterId={character._id} />,
    },
    {
      label: 'Chats',
      key: 'chats',
      children: <div>Chats</div>,
    },
  ]

  return (
    <>
      <Head>
        <title>{`${character.name} | Garden of Eden`}</title>
        <meta
          property="og:title"
          key="title"
          content={`${character.name} | Garden of Eden`}
        />
        <meta
          property="og:description"
          content={`${character.name}'s Profile`}
          key="description"
        />
        <meta
          property="og:image"
          content={
            character.image
              ? character.image
              : 'https://app.eden.art/apple-touch-icon.png'
          }
          key="image"
        />
        <meta
          property="og:image:secure_url"
          content={
            character.image
              ? character.image
              : 'https://app.eden.art/apple-touch-icon.png'
          }
        />
        <meta property="og:image:alt" content={`${character.name} - Creator`} />
        <meta
          property="og:url"
          content={`${
            CONFIG.NEXT_PUBLIC_HOST
          }/creators/${character.name?.toLowerCase()}`}
        />
      </Head>

      <div className={`flex flex-col gap-2`}>
        <CharacterProfileHeader
          character={character}
          numCreations={character?.creationCount}
        />
        <Tabs
          defaultActiveKey="1"
          centered
          items={creatorPageTabs}
          destroyInactiveTabPane={true}
        />
      </div>
    </>
  )
}

const CharacterPage = ({ data }: { data: Character }) => {
  const { character: characterData } = useCharacter(data ? data._id : null, {
    fallbackData: data,
  })

  if (!data) {
    return null
  }

  return <CharacterPageContent character={characterData || data} />
}

export default CharacterPage
