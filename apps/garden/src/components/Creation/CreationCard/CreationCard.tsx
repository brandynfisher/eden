import Card, { CardProps } from '@/components/Card/Card'
import React, { FC } from 'react'

const CreationCard: FC<CardProps> = ({ ...rest }) => {
  return <Card {...rest} itemType="creation" />
}

export default CreationCard
