import { CldOgImageProps } from '@/components/Media/next-cloudinary/CldOgImage/CldOgImage'
import Head from 'next/head'
import React from 'react'

type OgImageTagsProps = {
  imageUrl: string
  twitterImageUrl: string
  width?: number | string
  height?: number | string
}

const OgImageTags = ({
  excludeTags = [],
  twitterTitle,
  twitterCard = 'summary_large_image',
  keys = {},
  ...props
}: CldOgImageProps & OgImageTagsProps) => {
  const { alt, width, height, imageUrl, twitterImageUrl, assetType } = props

  const metaKeys = {
    'og:image': 'og-image',
    'og:image:secure_url': 'og-image-secureurl',
    'og:image:width': 'og-image-width',
    'og:image:height': 'og-image-height',
    'og:image:alt': 'og-image-alt',
    'twitter:title': 'twitter-title',
    'twitter:card': 'twitter-card',
    'twitter:image': 'twitter-image',
    ...keys,
  }

  // We need to include the tags within the Next.js Head component rather than
  // directly adding them inside the Head otherwise we get unexpected results

  return (
    <Head>
      <meta key={metaKeys['og:image']} property="og:image" content={imageUrl} />
      <meta
        key={metaKeys['og:image:secure_url']}
        property="og:image:secure_url"
        content={imageUrl}
      />
      <meta
        key={metaKeys['og:image:width']}
        property="og:image:width"
        content={`${width}`}
      />
      <meta
        key={metaKeys['og:image:height']}
        property="og:image:height"
        content={`${height}`}
      />

      {alt && (
        <meta
          key={metaKeys['og:image:alt']}
          property="og:image:alt"
          content={alt}
        />
      )}

      {assetType === 'video' ? (
        <>
          <meta property="og:video:width" content={`${width}`} />
          <meta property="og:video:height" content={`${width}`} />
        </>
      ) : null}

      {/* Required for summary_large_image, exclude vai excludeTags */}
      {/* https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/summary-card-with-large-image */}
      {!excludeTags.includes('twitter:title') && (
        <meta
          key={metaKeys['twitter:title']}
          property="twitter:title"
          content={twitterTitle || ' '}
        />
      )}

      {!excludeTags.includes('twitter:card') && (
        <meta
          key={metaKeys['twitter:card']}
          property="twitter:card"
          content={twitterCard}
        />
      )}

      <meta
        key={metaKeys['twitter:image']}
        property="twitter:image"
        content={twitterImageUrl}
      />
    </Head>
  )
}

export default OgImageTags
