import { CardData } from '@/components/Card/Card'
import { capitalize, isVideoUrl } from '@/lib/string'
import { ItemType } from '@/providers/ModalProvider'
import { Collection, Concept, Creation, Creator } from '@edenlabs/eden-sdk'
import Head from 'next/head'
import React from 'react'
import { getCldVideoUrl } from '@/components/Media/helpers/getCldVideoUrl'
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '@/components/Media/constants/sizes'

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

type ShareTitleProps = { itemType: ItemType, itemName?: string, userName: string, itemSuffix?: string }
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
  title: string,
  description?: string,
  itemType: ItemType
  item: CardData|Creator|Collection
}) => {
  return (
    <Head>
      <title>{`${title} | Garden of Eden`}</title>
      <meta property='og:title' key='title' content={title} />
      {itemType === 'creation' &&
      isVideoUrl(getItemMediaUrl(itemType, item as Creation)) ? (
        <>
          <meta property='og:description' content={''} key='description' />
          <meta
            property='og:video'
            content={getItemMediaUrl(itemType, item as Creation)}
          />
          <meta property='og:type' content='video.other' key='type' />
          <meta
            property='og:video:secure_url'
            content={getItemMediaUrl(itemType, item as Creation)}
          />
          <meta property='og:video:type' content='video/mp4' key='video_type' />
          <meta
            property='og:video:duration'
            content={String(getItemMediaAttributes(item as Creation).duration)}
          />
          <meta
            property='og:video:width'
            content={String(OG_IMAGE_WIDTH)}
          />
          <meta
            property='og:video:height'
            content={String(OG_IMAGE_HEIGHT)}
          />
          <meta
            property='twitter:player'
            content={getItemMediaUrl(itemType, item as Creation)}
          />
          <meta
            property='twitter:player:stream'
            content={getItemMediaUrl(itemType, item as Creation)}
          />
        </>
      ) : (
        <>
          <meta
            property='og:description'
            content={description}
            key='description'
          />
        </>
      )}
      <meta property='twitter:site' content='@eden_art_' />
      <meta property='twitter:description' content={description} />

      {itemType === 'creation' || itemType === 'concept' || itemType === 'character' ? (
        <meta
          property='og:url'
          content={`${process.env.NEXT_PUBLIC_HOST}/${itemType}s/${item._id}`}
          key='url'
        />
      ) : null}
      {itemType === 'creator' ? (
        <meta
          property='og:url'
          content={`${process.env.NEXT_PUBLIC_HOST}/creators/${(item as Creator).username?.toLowerCase()}`}
          key='url'
        />
      ) : null}
      {itemType === 'collection' ? (
        <meta
          property='og:url'
          content={`${process.env.NEXT_PUBLIC_HOST}/collections/${item._id}`}
          key='url'
        />
      ) : null}
    </Head>
  )
}

export default HeadTags
