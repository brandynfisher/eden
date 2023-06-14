import { Creation } from '@eden-labs/eden-sdk'
import React from 'react'

const CreationDetail = ({ creation }: { creation: Creation }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold">{creation.name}</h1>
      <img src={creation.thumbnail} alt="" className="w-full" />
    </div>
  )
}

export default CreationDetail
