import { useElementSize } from '@mantine/hooks'
import { Button } from 'antd'
import React, { useEffect, useState } from 'react'

const TruncatedExpandableText = ({ text }: { text: string }) => {
  const [showMore, setShowMore] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const { ref, width, height } = useElementSize()

  useEffect(() => {
    if (!showMore && ref && ref.current) {
      setIsTruncated(ref.current.scrollHeight > ref.current.clientHeight)
    }
  }, [showMore, ref.current, height, width])

  return (
    <div>
      <span
        ref={ref}
        title={text}
        className={`relative text-sm select-text cursor-text w-full ${
          isTruncated ? 'mb-2' : ''
        } ${showMore ? '' : 'text-ellipsis line-clamp-2'}`}
      >
        {text}
      </span>
      {isTruncated && (
        <div className="w-full flex justify-center">
          <Button
            type="text"
            size="small"
            onClick={() => setShowMore(!showMore)}
            className="font-mono !text-xs text-gray-400 hover:underline cursor-pointer"
          >
            {showMore ? '< Less ' : 'More >'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default TruncatedExpandableText
