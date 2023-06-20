import { Creation } from '@eden-labs/eden-sdk'
import React from 'react'

const CreationDetail = ({ creation }: { creation: Creation }) => {
  return (
    <div>
      <img src={creation.thumbnail} alt="" className="w-full" />
    </div>
  )
}

export default CreationDetail
