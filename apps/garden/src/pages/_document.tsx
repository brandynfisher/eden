import { Head, Html, Main, NextScript } from 'next/document'
import React from 'react'
import type { FC } from 'react'

const Document: FC = () => (
  <Html lang="en">
    <Head>
      <title>Eden Art - Garden</title>
      <meta property="og:title" content="Eden Art - Garden" key="title" />
      <meta
        property="og:description"
        content="The Garden of Artificial Delights"
        key="title"
      />
      <meta
        property="description"
        content="The Garden of Artificial Delights"
        key="title"
      />
      <meta
        property="og:image"
        content="https://garden.eden.art/apple-touch-icon.png"
      />
      <meta
        name="viewport"
        content="width=device-width, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"
      />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
    </Head>
    <body>
      <Main />
      <NextScript />
    </body>
  </Html>
)

export default Document
