import { Creation } from '@eden-labs/eden-sdk'
import React from 'react'

const CreationDetail = ({ creation }: { creation: Creation }) => {
  return (
    <div className="flex justify-center items-center h-full">
      <img
        src={creation.thumbnail}
        alt=""
        className="max-h-full max-w-full object-contain"
      />
    </div>
  )
}

export default CreationDetail
