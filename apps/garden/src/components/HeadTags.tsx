import { CardData } from '@/components/Card/Card'
import { CONFIG } from '@/lib/config'
import { capitalize, isImageUrl, isVideoUrl, possessivy } from '@/lib/string'
import { ItemType } from '@/providers/ModalProvider'
import {
  Character,
  Collection,
  Concept,
  Creation,
  Creator,
} from '@edenlabs/eden-sdk'
import Head from 'next/head'
import React from 'react'

export const getItemMediaUrl = (
  itemType: ItemType,
  item: Creation | Concept,
) => {
  if (itemType === 'creation') {
    return item.uri
  }

  return item.thumbnail || ''
}

export const getItemMediaAttributes = (item: Creation) => {
  return item.mediaAttributes
}

export const CreationHeadTags = ({ creation }: { creation: Creation }) => {
  return (
    <HeadTags
      itemType="creation"
      itemSuffix={creation.task?.generator?.generatorName}
      item={creation}
    />
  )
}

export const ConceptHeadTags = ({ concept }: { concept: Concept }) => {
  return <HeadTags itemType="concept" itemName={concept.name} item={concept} />
}

export const CharacterHeadTags = ({ character }: { character: Character }) => {
  return (
    <HeadTags itemType="character" itemName={character.name} item={character} />
  )
}

export const CollectionHeadTags = ({
  collection,
}: {
  collection: Collection
}) => {
  return (
    <Head>
      <title>{`Collection "${collection.name}" by ${collection.creatorName} | Garden of Eden`}</title>
      <meta
        property="og:title"
        key="title"
        content={`Collection "${collection.name}" by ${collection.creatorName} | Garden of Eden`}
      />
      <meta
        property="og:description"
        content={`${collection.creations.length} creations curated by ${collection.creatorName}`}
        key="description"
      />
      <meta
        property="og:image"
        content={collection.displayImageUri}
        key="image"
      />
      <meta
        property="og:image:secure_url"
        content={collection.displayImageUri}
      />
      <meta
        property="og:image:alt"
        content={`${collection.name} - Collection by ${collection.creatorName}`}
      />
      <meta
        property="og:url"
        content={`${CONFIG.NEXT_PUBLIC_HOST}/collections/${collection._id}`}
      />
    </Head>
  )
}

export const CreatorHeadTags = ({ creator }: { creator: Creator }) => {
  const title = `${possessivy(creator.username)} Profile`

  return (
    <Head>
      <title>{`${title} | Garden of Eden`}</title>
      <meta property="og:title" key="title" content={title} />
      <meta
        property="og:description"
        content={`${creator.creationsCount} Creations | ${creator.followerCount} Followers`}
        key="description"
      />
      <meta
        property="og:image"
        content={
          creator.userImage
            ? creator.userImage
            : 'https://app.eden.art/apple-touch-icon.png'
        }
        key="image"
      />
      <meta
        property="og:image:secure_url"
        content={
          creator.userImage
            ? creator.userImage
            : 'https://app.eden.art/apple-touch-icon.png'
        }
      />
      <meta property="og:image:alt" content={title} />
      <meta
        property="og:url"
        content={`${
          CONFIG.NEXT_PUBLIC_HOST
        }/creators/${creator.username?.toLowerCase()}`}
      />
    </Head>
  )
}

const HeadTags = ({
  itemType,
  itemName,
  itemSuffix,
  item,
}: {
  itemType: ItemType
  itemName?: string
  itemSuffix?: string
  item: CardData
}) => {
  const title = `${capitalize(itemType)}${
    itemName ? ` "${itemName}"` : ''
  } by ${item?.user?.username}${itemSuffix ? ` | ${itemSuffix}` : ''}`

  return (
    <Head>
      <title>{`${title} | Garden of Eden`}</title>
      <meta property="og:title" key="title" content={title} />
      <meta property="og:description" content={item.name} key="description" />
      {itemType === 'character' ? (
        <>
          <meta
            property="og:image"
            content={(item as Character).image}
            key="image"
          />
          <meta
            property="og:image:secure_url"
            content={(item as Character).image}
            key="image_secure"
          />
          <meta name="twitter:image:src" content={(item as Character).image} />
        </>
      ) : null}
      {itemType === 'creation' &&
      isVideoUrl(getItemMediaUrl(itemType, item as Creation)) ? (
        <>
          <meta
            property="og:image"
            content={(item as Creation).thumbnail}
            key="image"
          />
          <meta
            property="og:image:secure_url"
            content={(item as Creation).thumbnail}
            key="image_secure"
          />
          <meta
            property="og:video"
            content={getItemMediaUrl(itemType, item as Creation)}
          />
          <meta property="og:type" content="video.other" key="type" />
          <meta
            property="og:video:secure_url"
            content={getItemMediaUrl(itemType, item as Creation)}
          />
          <meta property="og:video:type" content="video/mp4" key="video_type" />
          <meta
            property="og:video:duration"
            content={String(getItemMediaAttributes(item as Creation).duration)}
          />
        </>
      ) : null}
      {(itemType === 'creation' &&
        isImageUrl(getItemMediaUrl(itemType, item as Creation))) ||
      itemType === 'concept' ? (
        <>
          <meta property="og:image:alt" content={title} />
          <meta property="og:image:type" content="image/jpeg" />
          <meta
            property="og:image"
            content={getItemMediaUrl(itemType, item as Creation | Concept)}
            key="image"
          />
          <meta
            property="og:image:secure_url"
            key="image_secure"
            content={getItemMediaUrl(itemType, item as Creation | Concept)}
          />
          <meta
            name="twitter:image:src"
            content={getItemMediaUrl(itemType, item as Creation | Concept)}
          />
        </>
      ) : null}
      {itemType === 'creation' &&
      isImageUrl(getItemMediaUrl(itemType, item as Creation)) ? (
        <>
          <meta
            property="og:image:width"
            content={String((item as Creation).mediaAttributes.width || 1024)}
          />
          <meta
            property="og:image:height"
            content={String((item as Creation).mediaAttributes.height || 1024)}
          />
        </>
      ) : (
        <>
          <meta property="og:image:width" content={String(1024)} />
          <meta property="og:image:height" content={String(1024)} />
        </>
      )}
      <meta name="twitter:site" content="Garden of Eden" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={item.name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        property="og:url"
        content={`${CONFIG.NEXT_PUBLIC_HOST}/${itemType}s/${item._id}`}
      />
    </Head>
  )
}

export default HeadTags
