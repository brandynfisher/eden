import { SharedSession } from '@/features/sessions/shared-session'
import { getSuspectedMediaType } from '@/features/sessions/utils/files'
import { siteConfig } from '@/lib/config'
import { getCloudfrontOriginalUrl, getCloudfrontUrl } from '@/lib/media'
import { EdenClient, Message } from '@edenlabs/eden-sdk'
import { Metadata, ResolvingMetadata } from 'next'
import { cache } from 'react'

type PageParams = { params: { id: string } }

interface ShareResponse {
  share?: {
    share_id: string
    title?: string
    createdAt?: string | Date
    owner?: { username?: string }
    session?: { _id: string }
    messages?: Message[]
  }
  error?: string
}

const getShare = cache(
  async (shareId: string): Promise<ShareResponse | undefined> => {
    if (!shareId) return undefined
    try {
      const eden = new EdenClient({
        edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
      })
      // SDK method signature inferred from client usage
      // @ts-ignore - if types differ we fallback gracefully
      const res: ShareResponse = await eden.sessions.v2.share.get({
        share_id: shareId,
      })
      return res
    } catch (e) {
      console.error('[share generateMetadata] fetch error', e)
      return undefined
    }
  },
)

function pickLastImage(messages: Message[] | undefined): string | undefined {
  if (!messages || messages.length === 0) return undefined
  // Iterate from last to first message
  for (let mIndex = messages.length - 1; mIndex >= 0; mIndex--) {
    const m = messages[mIndex]
    if (!m.attachments || m.attachments.length === 0) continue
    // Iterate attachments from last to first
    for (let aIndex = m.attachments.length - 1; aIndex >= 0; aIndex--) {
      const att = m.attachments[aIndex]
      if (att && getSuspectedMediaType(att) === 'image') {
        return att
      }
    }
  }
  return undefined
}

export async function generateMetadata(
  { params }: PageParams,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const shareId = params.id
  if (!shareId) return {}

  const data = await getShare(shareId)
  if (!data?.share) return {}

  const previousOg = (await parent).openGraph || {}
  const previousTwitter = (await parent).twitter || {}

  const titleBase = data.share.title || 'Shared Session'
  const title = `${titleBase} | ${siteConfig.name}`
  const description = data.share.owner?.username
    ? `Conversation shared by ${data.share.owner.username}`
    : 'A shared conversation on Eden'

  const lastImageFilename = pickLastImage(data.share.messages)
  let imageUrl: string | undefined
  if (lastImageFilename) {
    // Prefer sized webp variant when possible; fallback to original if empty
    imageUrl =
      getCloudfrontUrl(lastImageFilename, 1024) ||
      getCloudfrontOriginalUrl(lastImageFilename)
  }
  if (!imageUrl) {
    imageUrl = siteConfig.ogImage
  }

  const url = `${
    process.env.NEXT_PUBLIC_HOST || siteConfig.url.base
  }/sessions/share/${shareId}`

  return {
    title,
    description,
    openGraph: {
      ...(previousOg as any),
      title,
      description,
      url,
      type: 'article',
      images: imageUrl ? [imageUrl] : (previousOg as any).images,
    },
    twitter: {
      ...(previousTwitter as any),
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : (previousTwitter as any).images,
    },
  }
}

export default async function SharedSessionPage({ params }: PageParams) {
  return <SharedSession shareId={params.id} />
}
