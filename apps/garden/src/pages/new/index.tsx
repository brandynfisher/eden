import { CONFIG } from '@/lib/config'
import { fetcher as fetcherFn } from '@/lib/fetcher'
import HomePageNew from '@/pages/new/HomePageNew'
import { Concept } from '@edenlabs/eden-sdk'
import { GetStaticProps } from 'next'

// @todo: implement SSR: fetch at least everything above the fold on the server if possible (highlighted concepts, featured concepts)
const highlightItemsConfig = [
  {
    conceptId: '655f8b0b000112de0b25db7d',
    coverImageUri:
      'https://edenartlab-stage-data.s3.us-east-1.amazonaws.com/38935e6736436fa7ee30a2e2defc345063150ee27bbecf88df11094209718dbb.jpg',
  },
  {
    conceptId: '655f6eb5000112de0be180c0',
    coverImageUri:
      'https://edenartlab-stage-data.s3.us-east-1.amazonaws.com/ac9fc10de7e75d32e5cab043f8e6d17ddb73391bb862edaa7b5219f9f7fcdc42.jpg',
  },
  {
    conceptId: '655f71ac000112de0bece126',
    coverImageUri:
      'https://edenartlab-stage-data.s3.us-east-1.amazonaws.com/ba44da70d2caa1dd8bd909c80e9f5f5e91fe08bab50e387706eac98db768e9cb.jpg',
  },
]

const fetchHighlights = async (conceptId: string) => {
  return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/concepts/${conceptId}`)
}

type PageProps = {
  data: {
    highlightItems: {
      concept?: Concept
      coverImageUri: string
    }[]
  }
  error?: string
}

export const getStaticProps = (async () => {
  const highlightItems = await Promise.all(
    highlightItemsConfig.map(async item => {
      return {
        ...(await fetchHighlights(item.conceptId)),
        coverImageUri: item.coverImageUri,
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
