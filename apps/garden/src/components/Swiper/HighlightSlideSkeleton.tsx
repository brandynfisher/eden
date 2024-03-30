import React from 'react'

const HighlightSlideSkeleton = () => {
  return (
    <div className="pb-10 pt-10 bg-gray-900 rounded-lg animate-pulse bg-opacity-50">
      <div className="h-full w-full aspect-square bg-gray-800 bg-opacity-50" />
    </div>
  )
}

export default HighlightSlideSkeleton
