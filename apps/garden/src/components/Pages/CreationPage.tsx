import Details from '@/components/Detail/Details'
import { useCreation } from '@/hooks/useCreation'
// import { Creation } from '@edenlabs/eden-sdk'
import React from 'react'

// const CreationPage = ({ data }: { data: Creation }) => {
//   const { creation: creationData } = useCreation(data ? data._id : null, {
//     fallbackData: data,
//   })
//
//   if (!data) {
//     return null
//   }
//
//   return <Details itemType="creation" item={creationData || data} />
// }

const CreationPage = ({ creationId }: { creationId: string }) => {
  const { creation: creationData } = useCreation(creationId ? creationId : null)

  if (!creationId || !creationData) {
    return null
  }

  return <Details itemType="creation" item={creationData} />
}


export default CreationPage
