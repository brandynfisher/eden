import { CardData } from '@/components/Card/Card'
import { getCldVideoUrl } from '@/components/Media/helpers/getCldVideoUrl'
import { capitalize, isVideoUrl } from '@/lib/string'
import { ItemType } from '@/providers/ModalProvider'
import {
  Collection,
  Concept,
  Creation,
  Creator,
  MediaType,
} from '@edenlabs/eden-sdk'
import Head from 'next/head'
import React from 'react'

export const getItemMediaUrl = (
  itemType: ItemType,
  item: Creation | Concept,
) => {
  if (
    itemType === 'creation' &&
    (item as Creation).mediaAttributes.type === MediaType.Video
  ) {
    const videoUrl = item.uri.startsWith('https://res.cloudinary.com/')
      ? getCldVideoUrl({
          src: item.uri,
        }) + '.mp4'
      : item.uri

    return videoUrl
  }

  return item.thumbnail || ''
}

export const getItemMediaAttributes = (item: Creation) => {
  return item.mediaAttributes
}

type ShareTitleProps = {
  itemType: ItemType
  itemName?: string
  userName: string
  itemSuffix?: string
}
export const createShareTitle = (props: ShareTitleProps) => {
  return `${capitalize(props.itemType)}${
    props.itemName ? ` "${props.itemName}"` : ''
  } by ${props.userName}${props.itemSuffix ? ` | ${props.itemSuffix}` : ''}`
}

const HeadTags = ({
  itemType,
  title,
  description,
  item,
}: {
  title: string
  description?: string
  itemType: ItemType
  item: CardData | Creator | Collection
}) => {
  return (
    <Head>
      <title>{`${title} | Eden.art`}</title>
      <meta property="og:title" key="og-title" content={title} />

      {itemType === 'creation' && isVideoUrl((item as Creation).uri) ? (
        <>
          <meta property="og:type" content="video.other" key="og-type" />
          <meta
            property="og:video:duration"
            content={String(getItemMediaAttributes(item as Creation).duration)}
          />
        </>
      ) : null}
      <meta
        property="twitter:site"
        content="@eden_art_"
        key="og-twitter-site"
      />

      <meta
        property="og:description"
        content={description}
        key="og-description"
      />
      <meta
        property="twitter:description"
        content={description}
        key="twitter-description"
      />

      {itemType === 'creation' ||
      itemType === 'concept' ||
      itemType === 'character' ? (
        <meta
          property="og:url"
          content={`${process.env.NEXT_PUBLIC_HOST}/${itemType}s/${item._id}`}
          key="url"
        />
      ) : null}
      {itemType === 'creator' ? (
        <meta
          property="og:url"
          content={`${process.env.NEXT_PUBLIC_HOST}/creators/${(
            item as Creator
          ).username?.toLowerCase()}`}
          key="url"
        />
      ) : null}
      {itemType === 'collection' ? (
        <meta
          property="og:url"
          content={`${process.env.NEXT_PUBLIC_HOST}/collections/${item._id}`}
          key="url"
        />
      ) : null}
    </Head>
  )
}

export default HeadTags
