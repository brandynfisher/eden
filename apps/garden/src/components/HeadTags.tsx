import { CardData } from '@/components/Card/Card'
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
} from '@/components/Media/constants/sizes'
import { getCldVideoUrl } from '@/components/Media/helpers/getCldVideoUrl'
import { capitalize, isVideoUrl } from '@/lib/string'
import { ItemType } from '@/providers/ModalProvider'
import { Collection, Concept, Creation, Creator } from '@edenlabs/eden-sdk'
import Head from 'next/head'
import React from 'react'

export const getItemMediaUrl = (
  itemType: ItemType,
  item: Creation | Concept,
) => {
  if (
    itemType === 'creation' &&
    (item as Creation).mediaAttributes.type === 'video'
  ) {
    const videoUrl = item.uri.startsWith('https://res.cloudinary.com/')
      ? getCldVideoUrl({
          src: item.uri,
        })
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
      <title>{`${title} | Garden of Eden`}</title>
      <meta property="og:title" key="title" content={title} />
      <meta
        property="og:description"
        content={description || ''}
        key="og-description"
      />
      {itemType === 'creation' &&
      isVideoUrl(getItemMediaUrl(itemType, item as Creation)) ? (
        <>
          <meta property="description" content={''} key="description" />
          <meta property="og:description" content={''} key="og-description" />
          <meta
            property="og:video:url"
            content={getItemMediaUrl(itemType, item as Creation) + '.mp4'}
          />
          <meta
            property="og:video:secure_url"
            content={getItemMediaUrl(itemType, item as Creation) + '.mp4'}
          />
          <meta property="og:type" content="video.other" key="type" />
          <meta
            property="og:video:duration"
            content={String(getItemMediaAttributes(item as Creation).duration)}
          />
          <meta
            property="og:video:width"
            content={String(
              (item as Creation).uri.startsWith('https://res.cloudinary.com/')
                ? String(OG_IMAGE_WIDTH)
                : (item as Creation).mediaAttributes.width,
            )}
          />
          <meta
            property="og:video:height"
            content={String(
              (item as Creation).uri.startsWith('https://res.cloudinary.com/')
                ? String(OG_IMAGE_HEIGHT)
                : (item as Creation).mediaAttributes.height,
            )}
          />
          <meta property="og:video:type" content="video/mp4" key="video_type" />
          <meta
            property="twitter:player"
            content={getItemMediaUrl(itemType, item as Creation) + '.mp4'}
          />
          <meta
            property="twitter:player:stream"
            content={getItemMediaUrl(itemType, item as Creation)}
          />
          <meta
            property="twitter:content_type"
            content="video/mp4"
            key="twitter-content-type"
          />
        </>
      ) : null}
      <meta property="twitter:site" content="@eden_art_" key="twitter-site" />

      {description ? (
        <meta
          property="twitter:description"
          content={description}
          key="twitter-description"
        />
      ) : null}

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
