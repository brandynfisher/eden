import { HighlightItem } from '@/components/Swiper/HighlightsSwiper'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import HomePageNew from '@/pages/new/HomePageNew'
import { GetStaticProps } from 'next'

// @todo: implement SSR: fetch at least everything above the fold on the server if possible (highlighted concepts, featured concepts)
const highlightItemsConfig =
  // process.env.NODE_ENV === 'production'
  //   ? [
  //       {
  //         conceptId: '65c96097ca4d496037182909',
  //         creationId: '65d8520568213d8af1c89979',
  //       },
  //       {
  //         conceptId: '65c9c50fca4d4960374760bc',
  //         creationId: '65cb13344186294ff1c9785b',
  //       },
  //       {
  //         conceptId: '656649c31652bdba650fde4b',
  //         creationId: '6592fde7787755148ca7063c',
  //       },
  //     ]
  //   :
  [
    {
      conceptId: '655f8b0b000112de0b25db7d',
      creationId: '655fce56212b3ec332b9a6b0',
    },
    {
      conceptId: '655f6eb5000112de0be180c0',
      creationId: '6601f89c5ddda6f212229ea0',
    },
    {
      conceptId: '655f71ac000112de0bece126',
      creationId: '657f54171a2941378e53cb23',
    },
  ]

const fetchConcept = async (conceptId: string) => {
  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/concepts/${conceptId}`)
}

const fetchCreation = async (creationId: string) => {
  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/creations/${creationId}`)
}

type PageProps = {
  data: {
    highlightItems: HighlightItem[]
  }
  error?: string
}

export const getStaticProps = (async () => {
  const highlightItems = await Promise.all(
    highlightItemsConfig.map(async item => {
      return {
        ...(await fetchConcept(item.conceptId)),
        ...(await fetchCreation(item.creationId)),
      }
    }),
  )

  if (!highlightItems) {
    return { props: { data: { highlightItems: [] } } }
  }

  return { props: { data: { highlightItems } } }
}) satisfies GetStaticProps<PageProps>

export default function HomeNew({ data }: PageProps) {
  return <HomePageNew highlightItems={data.highlightItems} />
}
