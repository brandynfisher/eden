import Details from '@/components/Detail/Details'
import { useConcept } from '@/hooks/useConcept'
import { Concept } from '@edenlabs/eden-sdk'
import React from 'react'

const ConceptPage = ({ data }: { data: { concept: Concept } }) => {
  const { concept: conceptData } = useConcept(
    data && data.concept ? data?.concept._id : null,
    {
      fallbackData: data,
    },
  )

  if (!data) {
    return null
  }

  return <Details itemType="concept" item={conceptData || data.concept} />
}

export default ConceptPage
