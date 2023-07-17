export const truncatedAddress = (creatorId: string) =>
  `${creatorId.slice(0, 5)}...${creatorId.slice(-4)}`

export const rightTruncatedString = (str: string, length: number) =>
  str.length > length ? `${str.slice(0, length)}...` : str
