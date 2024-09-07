import { SubscriptionTier } from '@edenlabs/eden-sdk'

export const truncatedAddress = (creatorId: string) =>
  `${creatorId.slice(0, 5)}...${creatorId.slice(-4)}`

export const rightTruncatedString = (str: string, length: number) =>
  str.length > length ? `${str.slice(0, length)}...` : str

export const truncateText = (text: string, maxLength = 20) => {
  if (text.length <= maxLength) {
    return text
  }

  const lengthStart = maxLength / 2
  const lengthEnd = maxLength - lengthStart - 3

  return `${text.slice(0, lengthStart)}...${text.slice(-lengthEnd)}`
}

export const isImageUrl = (url: string) => {
  return /(\/image\/)|(\.(jpg|jpeg|png|webp|avif|gif|svg))$/.test(url)
}

export const isVideoUrl = (url: string) => {
  return /(\/video\/)|(\.(mp4|webm|m3u8))$/.test(url)
}

export const capitalize = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const possessivy = (name: string | undefined) => {
  return name ? (name.endsWith('s') ? `${name}'` : `${name}'s`) : ''
}

export const sanitize = (text: string) => {
  return text.replace(/[^a-z0-9_\-\s]/gi, '_')
}

export const subscriptionTierNameMap: Record<SubscriptionTier, string> = {
  [SubscriptionTier.Free]: 'Free',
  [SubscriptionTier.Basic]: 'Basic',
  [SubscriptionTier.Pro]: 'Pro',
  [SubscriptionTier.Believer]: 'Believer',
  [SubscriptionTier.Admin]: 'Admin',
}
