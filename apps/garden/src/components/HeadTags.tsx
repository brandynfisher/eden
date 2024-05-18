import { CardData } from '@/components/Card/Card'
import { capitalize, isVideoUrl, possessivy } from '@/lib/string'
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
import { getCldVideoUrl } from '@/components/Media/helpers/getCldVideoUrl'

export const getItemMediaUrl = (
  itemType: ItemType,
  item: Creation | Concept,
) => {
  if (itemType === 'creation' && (item as Creation).mediaAttributes.type !== 'image') {

    //@todo: don't do this on NON cloudinary assets!
    console.log((item as Creation).mediaAttributes.type)

    const videoUrl = getCldVideoUrl({
      src: item.uri,
    })

    console.log(itemType, (item as Creation).mediaAttributes.type, item.uri, videoUrl)
    return videoUrl
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
        content={`${process.env.NEXT_PUBLIC_HOST}/collections/${collection._id}`}
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
          process.env.NEXT_PUBLIC_HOST
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
      {/*{itemType === 'character' ? (*/}
      {/*  <>*/}
      {/*    <meta*/}
      {/*      property="og:image"*/}
      {/*      content={(item as Character).image}*/}
      {/*      key="image"*/}
      {/*    />*/}
      {/*    <meta*/}
      {/*      property="og:image:secure_url"*/}
      {/*      content={(item as Character).image}*/}
      {/*      key="image_secure"*/}
      {/*    />*/}
      {/*  </>*/}
      {/*) : null}*/}
      {itemType === 'creation' &&
      isVideoUrl(getItemMediaUrl(itemType, item as Creation)) ? (
        <>
          <meta property="og:description" content={''} key="description" />
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
          <meta
            name="og:video:width"
            content={String(getItemMediaAttributes(item as Creation).width)}
          />
          <meta
            name="og:video:height"
            content={String(getItemMediaAttributes(item as Creation).height)}
          />
          <meta
            property="twitter:player"
            content={getItemMediaUrl(itemType, item as Creation)}
          />
          <meta
            property="twitter:player:stream"
            content={getItemMediaUrl(itemType, item as Creation)}
          />
        </>
      ) : (
        <>
          <meta
            property="og:description"
            content={item.name}
            key="description"
          />
        </>
      )}
      <meta property="twitter:site" content="@eden_art_" />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={item.name} />
      <meta
        property="og:url"
        content={`${process.env.NEXT_PUBLIC_HOST}/${itemType}s/${item._id}`}
      />
    </Head>
  )
}

export default HeadTags
