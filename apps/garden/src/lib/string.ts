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
  return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url)
}

export const isVideoUrl = (url: string) => {
  return /\.(mp4)$/.test(url)
}
