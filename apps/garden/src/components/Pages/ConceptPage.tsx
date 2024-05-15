import Details from '@/components/Detail/Details'
import { useConcept } from '@/hooks/useConcept'
import React from 'react'
import { Concept } from '@edenlabs/eden-sdk'

const ConceptPage = ({ initialData }: { initialData: Concept }) => {
  const { concept: conceptData } = useConcept(
    initialData && initialData ? initialData._id : null,
    {
      fallbackData: initialData,
    },
  )

  if (!initialData && !conceptData) {
    return null
  }

  return <Details itemType="concept" item={conceptData || initialData} />
}

export default ConceptPage
