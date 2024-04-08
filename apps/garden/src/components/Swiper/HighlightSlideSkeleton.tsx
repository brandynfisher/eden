import React from 'react'

const HighlightSlideSkeleton = () => {
  return (
    <div className="relative grid grid-cols-2 h-64 rounded-lg overflow-hidden animate-pulse">
      <div className="h-full w-full aspect-square bg-gray-900 bg-opacity-50"></div>
      <div className="h-full w-full bg-gray-800 bg-opacity-50" />
    </div>
  )
}

export default HighlightSlideSkeleton
