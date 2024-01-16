import { CardData } from '@/components/Card/Card'
import { CONFIG } from '@/lib/config'
import { isImageUrl, isVideoUrl } from '@/lib/string'
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
  return <HeadTags itemType="creation" item={creation} />
}

export const ConceptHeadTags = ({ concept }: { concept: Concept }) => {
  return <HeadTags itemType="concept" item={concept} />
}

export const CharacterHeadTags = ({ character }: { character: Character }) => {
  return <HeadTags itemType="character" item={character} />
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
  return (
    <Head>
      <title>{`${creator.username} | Garden of Eden`}</title>
      <meta
        property="og:title"
        key="title"
        content={`${creator.username} | Garden of Eden`}
      />
      <meta
        property="og:description"
        content={`${creator.username}'s Profile - ${creator.creationsCount} Creations | ${creator.followerCount} Followers`}
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
      <meta property="og:image:alt" content={`${creator.username} - Creator`} />
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
  item,
}: {
  itemType: ItemType
  item: CardData
}) => {
  return (
    <Head>
      <title>{`/${itemType} by ${item?.user?.username} | Garden of Eden`}</title>
      <meta
        property="og:title"
        key="title"
        content={`/${itemType} by ${item?.user?.username} | Garden of Eden`}
      />
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
          <meta
            property="og:image:alt"
            content={`/${itemType} by ${item?.user?.username} | Garden of Eden`}
          />
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
        </>
      ) : null}
      <meta
        property="og:url"
        content={`${CONFIG.NEXT_PUBLIC_HOST}/${itemType}s/${item._id}`}
      />
    </Head>
  )
}

export default HeadTags
