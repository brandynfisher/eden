export const truncatedAddress = (creatorId: string) =>
  `${creatorId.slice(0, 5)}...${creatorId.slice(-4)}`
