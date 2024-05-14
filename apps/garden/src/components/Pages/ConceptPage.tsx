import Details from '@/components/Detail/Details'
import { useConcept } from '@/hooks/useConcept'
import { Concept } from '@edenlabs/eden-sdk'
import React from 'react'
import { CONFIG } from '@/lib/config'

const ConceptPage = ({ data }: { data: { concept: Concept } }) => {
  const { concept: conceptData } = useConcept(
    data && data.concept ? data?.concept._id : null,
    {
      fallbackData: data,
    },
  )

  console.log({ process: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, config: CONFIG.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME })
  console.log({conceptData})

  if (!data) {
    return null
  }

  return <Details itemType="concept" item={conceptData || data.concept} />
}

export default ConceptPage
