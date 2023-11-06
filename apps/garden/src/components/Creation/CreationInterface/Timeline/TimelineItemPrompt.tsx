import React from 'react'

const TimelineItemPrompt = ({ text }: { text?: string }) => {
  if (!text) {
    return null
  }

  return (
    <div title={text} className="mb-2">
      <span className="relative first-letter:uppercase text-xs select-text cursor-text text-ellipsis dark:text-gray-400 break-words line-clamp-2">
        {text}
      </span>
    </div>
  )
}

export default TimelineItemPrompt
