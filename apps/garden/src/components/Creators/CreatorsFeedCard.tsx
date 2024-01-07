import Card, { CardProps } from '@/components/Card/Card'
import React, { FC } from 'react'

const CreatorFeedCard: FC<CardProps> = ({ ...rest }) => {
  return <Card {...rest} itemType="creator" />
}

export default CreatorFeedCard
