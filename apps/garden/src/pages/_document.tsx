// import { StyleProvider, createCache } from '@ant-design/cssinjs'
import {
  // DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document'
import React from 'react'

// import { doExtraStyle } from '../../scripts/generateAntdCss'

const CustomDocument = () => (
  <Html lang="en">
    <Head>
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
//
// CustomDocument.getInitialProps = async (ctx: DocumentContext) => {
//   const cache = createCache()
//   let fileName = ''
//   const originalRenderPage = ctx.renderPage
//   ctx.renderPage = () =>
//     originalRenderPage({
//       enhanceApp: App => props =>
//         (
//           <StyleProvider cache={cache}>
//             <App {...props} />
//           </StyleProvider>
//         ),
//     })
//
//   const initialProps = await Document.getInitialProps(ctx)
//   // 1.1 extract style which had been used
//   fileName = doExtraStyle({
//     cache,
//   })
//   return {
//     ...initialProps,
//     styles: (
//       <>
//         {initialProps.styles}
//         {/* 1.2 inject css */}
//         {fileName && <link rel="stylesheet" href={`/${fileName}`} />}
//       </>
//     ),
//   }
// }

export default CustomDocument
