import { SharedSession } from '@/features/sessions/shared-session'
import { getSuspectedMediaType } from '@/features/sessions/utils/files'
import { siteConfig } from '@/lib/config'
import { getFileTypeByMimeType } from '@/lib/files'
import { getCloudfrontOriginalUrl, getCloudfrontUrl } from '@/lib/media'
import { EdenClient, Message } from '@edenlabs/eden-sdk'
import { Metadata, ResolvingMetadata } from 'next'

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

// Fetch share data (no react cache so new shares update metadata immediately)
async function fetchShare(shareId: string): Promise<ShareResponse | undefined> {
  if (!shareId) return undefined
  try {
    const eden = new EdenClient({
      edenApiUrl: process.env.NEXT_PUBLIC_EDEN_API_URL,
    })
    // @ts-ignore SDK dynamic method
    const res: ShareResponse = await eden.sessions.v2.share.get({
      share_id: shareId,
    })
    return res
  } catch (e) {
    console.error('[share generateMetadata] fetch error', e)
    return undefined
  }
}

// Find the most recent image from attachments OR tool call outputs
function pickLastImage(messages: Message[] | undefined): string | undefined {
  if (!messages || messages.length === 0) return undefined
  for (let i = messages.length - 1; i >= 0; i--) {
    const m: any = messages[i]

    // 1. Direct attachments (strings)
    if (Array.isArray(m.attachments) && m.attachments.length) {
      for (let j = m.attachments.length - 1; j >= 0; j--) {
        const att = m.attachments[j]
        if (att && getSuspectedMediaType(att) === 'image') return att
      }
    }

    // 2. Tool call results (nested outputs -> filename or url)
    if (Array.isArray(m.tool_calls) && m.tool_calls.length) {
      for (let tc = m.tool_calls.length - 1; tc >= 0; tc--) {
        const toolCall = m.tool_calls[tc]
        const results = toolCall?.result
        if (Array.isArray(results)) {
          for (let r = results.length - 1; r >= 0; r--) {
            const result = results[r]
            const outputArr = (result as any)?.output
            if (Array.isArray(outputArr)) {
              for (let o = outputArr.length - 1; o >= 0; o--) {
                const out = outputArr[o]
                const fname: string | undefined = out?.filename || out?.url
                if (!fname) continue
                const mime = out?.mediaAttributes?.mimeType as
                  | string
                  | undefined
                const fileType = mime
                  ? getFileTypeByMimeType(mime)
                  : getSuspectedMediaType(fname)
                if (fileType === 'image') return fname
              }
            } else if (typeof outputArr === 'string') {
              if (getSuspectedMediaType(outputArr) === 'image') return outputArr
            }
          }
        }
      }
    }
  }
  return undefined
}

// Revalidate periodically so new images appear if a share was created then content generated after
export const revalidate = 120

export async function generateMetadata(
  { params }: PageParams,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const shareId = params.id
  if (!shareId) return {}

  const data = await fetchShare(shareId)
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
    const sized = getCloudfrontUrl(lastImageFilename, 1024)
    const original = getCloudfrontOriginalUrl(lastImageFilename)
    imageUrl = sized || original || undefined
  }
  if (!imageUrl) imageUrl = siteConfig.ogImage

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
