// import { HighlightItem } from '@/components/Swiper/HighlightsSwiper'
// import { CONFIG } from '@/lib/config'
// import { fetcher as fetcherFn } from '@/lib/fetcher'
// import HomePageNew from '@/pages/new/HomePageNew'
// import { Concept, Creator } from '@edenlabs/eden-sdk'
// import { GetStaticProps } from 'next'
//
// const highlightItemsConfig =
//   process.env.NEXT_PUBLIC_APP_ENV === 'production'
//     ? [
//         {
//           conceptId: '65c96097ca4d496037182909',
//           creationId: '65d8520568213d8af1c89979',
//         },
//         {
//           conceptId: '65c9c50fca4d4960374760bc',
//           creationId: '65cb13344186294ff1c9785b',
//         },
//         {
//           conceptId: '656649c31652bdba650fde4b',
//           creationId: '6592fde7787755148ca7063c',
//         },
//       ]
//     : [
//         {
//           conceptId: '655f8b0b000112de0b25db7d',
//           creationId: '655fce56212b3ec332b9a6b0',
//           description:
//             'Optional Curator Description that overwrites concept description',
//         },
//         {
//           conceptId: '655f6eb5000112de0be180c0',
//           creationId: '6601f89c5ddda6f212229ea0',
//         },
//         {
//           conceptId: '655f71ac000112de0bece126',
//           creationId: '657f54171a2941378e53cb23',
//         },
//       ]
//
// const fetchConcept = async (conceptId: string) => {
//   return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/concepts/${conceptId}`)
// }
//
// const fetchCreation = async (creationId: string) => {
//   return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/creations/${creationId}`)
// }
//
// const fetchFeaturedArtists = async () => {
//   return fetcherFn(
//     `${CONFIG.NEXT_PUBLIC_HOST}/api/feed/creators?page=1&limit=10&orderBy=followerCount&direction=-1`,
//   )
// }
//
// const fetchFeaturedConcepts = async () => {
//   return fetcherFn(
//     `${CONFIG.NEXT_PUBLIC_HOST}/api/feed/concepts?page=1&limit=10&orderBy=creationCount&direction=-1`,
//   )
// }
//
// type PageProps = {
//   data: {
//     highlightItems: HighlightItem[]
//     featuredConcepts: Concept[]
//     featuredArtists: Creator[]
//   }
//   error?: string
// }
//
// export const getStaticProps = (async () => {
//   const highlightItems = await Promise.all(
//     highlightItemsConfig.map(async item => {
//       return {
//         ...(await fetchConcept(item.conceptId)),
//         ...(await fetchCreation(item.creationId)),
//         description: item.description ? item.description : null,
//       }
//     }),
//   )
//
//   const featuredConcepts = await fetchFeaturedConcepts()
//   const featuredArtists = await fetchFeaturedArtists()
//
//   return {
//     props: {
//       data: {
//         highlightItems,
//         featuredConcepts: featuredConcepts.docs,
//         featuredArtists: featuredArtists.docs,
//       },
//     },
//   }
// }) satisfies GetStaticProps<PageProps>

export default function HomeNew() {
  return (
    // <HomePageNew
    //   highlightItems={data.highlightItems}
    //   featuredConcepts={data.featuredConcepts}
    //   featuredArtists={data.featuredArtists}
    // />
    <div>soon</div>
  )
}
