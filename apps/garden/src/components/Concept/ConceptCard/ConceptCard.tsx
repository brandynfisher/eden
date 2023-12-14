import Card, { CardProps } from '@/components/Card/Card'
import React, { FC } from 'react'

export const trainingModeColorMap: { [key: string]: string } = {
  style: 'lime',
  face: 'blue',
  concept: 'purple',
  object: 'cyan',
}

const ConceptCard: FC<CardProps> = ({ ...rest }) => {
  return <Card {...rest} itemType="concept" />
}

export default ConceptCard
