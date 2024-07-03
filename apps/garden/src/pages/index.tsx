import HomePageNew from '@/components/Pages/HomePageNew'
import { HighlightItem } from '@/components/Swiper/HighlightsSwiper'
import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import { Concept, Creator } from '@edenlabs/eden-sdk'
import { GetStaticProps } from 'next'

const highlightItemsConfig =
  process.env.NEXT_PUBLIC_APP_ENV === 'production'
    ? [
        {
          conceptId: '65c96097ca4d496037182909', //misc6 ygor
          creationId: '65d8521668213d8af1c8a22b',
          description:
            'Custom model trained with original hand-drawn artwork from artist Ygor Marotta, this model is great at applying vibrant hand-drawn styles to just about anything.',
        },
        {
          conceptId: '656649c31652bdba650fde4b', //Retroposterdesign Avishag
          creationId: '65ac2d91d5a89a5e712205d1',
          description:
            'Inspired by vintage poster designs and created with vibrant colors. This model accentuates symmetry, sacred symbols and is great for poster art and album covers.',
        },
        {
          conceptId: '65c9c50fca4d4960374760bc', //PlanTA aleflo
          creationId: '65cb128c4186294ff1c90ee8',
          description:
            'This concept is great for creating beautiful high quality immersive imageries enriched with glowing green leaves, liquids and alien-looking plants',
        },
      ]
    : [
        {
          conceptId: '655f8b0b000112de0b25db7d',
          creationId: '655fce56212b3ec332b9a6b0',
          description:
            'Optional Curator Description that overwrites concept description',
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

const featuredConceptsConfig =
  process.env.NEXT_PUBLIC_APP_ENV === 'production'
    ? [
        '657a336d0a0f7257405ad024',
        // '66239eb77249a30fcb4b470a', private
        '650599a8160561d1aff45f9f',
        '6620298d3a1b516798ff0c86',
        '65642f9f730b5e00f6f253df',
        '65bc43d441d1272266fd5ab4',
        '6575506c377857179cdea9ec',
        '656b9be209360ec0b968dede',
        '65634ad7730b5e00f6c672f0',
        // '65d07e1e1bbb12fb04c8c309', private
        '65846c0ec08aceee0e5b70fe',
      ]
    : [
        '6532db8b592328dcf4a42df8',
        '655f4b5e000112de0bb6d8b2',
        '655fce1b212b3ec332b7e61b',
        '656fb12d59d8e0fe4211547f',
        '656171c80c11a3d5d3bcdc90',
        '655f71ac000112de0bece126',
      ]

const featuredArtistsConfig =
  process.env.NEXT_PUBLIC_APP_ENV === 'production'
    ? [
        'abraham',
        'marzipan',
        'chebel',
        'avishagaya',
        'stein',
        'matesteinforth',
        'va2rosa',
        'drmbt',
        'aleqth',
        'infoerror',
        // 'objektpermanenz81',
        'xander',
      ]
    : [
        'xander',
        'va2rosa',
        'xander_eden',
        'jmill4747',
        'gene3',
        'laub-local-new',
      ]

const fetchConcept = async (conceptId: string) => {
  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/concepts/${conceptId}`)
}

const fetchCreation = async (creationId: string) => {
  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/creations/${creationId}`)
}

const fetchCreator = async (creatorId: string) => {
  return fetcherFn(
    `${CONFIG.NEXT_PUBLIC_HOST}/api/creators?creatorId=${creatorId}`,
  )
}

type PageData = {
  highlightItems: HighlightItem[]
  featuredConcepts: Concept[]
  featuredArtists: Creator[]
}

type PageProps = {
  data: PageData
  error?: string
}

export const getStaticProps = (async () => {
  const data: PageData = {
    highlightItems: [],
    featuredConcepts: [],
    featuredArtists: [],
  }

  try {
    data.highlightItems = await Promise.all(
      highlightItemsConfig.map(async item => {
        return {
          ...(await fetchConcept(item.conceptId)),
          ...(await fetchCreation(item.creationId)),
          description: item.description ? item.description : null,
        }
      }),
    )
  } catch (e) {
    console.log('Error pre-rendering - highlightItems')
  }

  try {
    const featuredConcepts = await Promise.all(
      featuredConceptsConfig.map(async item => {
        const concept = await fetchConcept(item)

        if (concept) {
          return concept
        }

        return null
      }),
    )
    data.featuredConcepts = featuredConcepts
      .filter(Boolean)
      .map(item => item.concept)
  } catch (e) {
    console.log('Error pre-rendering - featuredConcepts')
  }

  try {
    const featuredArtists = await Promise.all(
      featuredArtistsConfig.map(async item => {
        return await fetchCreator(item)
      }),
    )
    data.featuredArtists = featuredArtists.map(item => item.creator)
  } catch (e) {
    console.log('Error pre-rendering - featuredArtists')
  }

  return {
    props: {
      data,
    },
  }
}) satisfies GetStaticProps<PageProps>

export default function HomeNew({ data }: PageProps) {
  return (
    <HomePageNew
      highlightItems={data.highlightItems}
      featuredConcepts={data.featuredConcepts}
      featuredArtists={data.featuredArtists}
    />
  )
}
