import CharacterCreationsTab from '@/components/Characters/CharacterCreationsTab'
import CharacterProfileHeader from '@/components/Characters/CharacterProfileHeader'
import { CONFIG } from '@/lib/config'
import { Character } from '@edenlabs/eden-sdk'
import { Tabs } from 'antd'
import Head from 'next/head'
import React from 'react'

const CharacterDetails = ({
  character,
  modalContainerRef,
  modalContainerHeight,
}: {
  character: Character
  modalContainerRef?: React.MutableRefObject<HTMLDivElement>
  modalContainerHeight?: number
}) => {
  const creatorPageTabs = [
    {
      label: 'Creations',
      key: 'creations',
      children: (
        <CharacterCreationsTab
          characterId={character._id}
          modalContainerRef={modalContainerRef}
          modalContainerHeight={modalContainerHeight}
        />
      ),
    },
    // {
    //   label: 'Chats',
    //   key: 'chats',
    //   children: <div>Chats</div>,
    // },
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

export default CharacterDetails
