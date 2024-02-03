import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined'
import CopyOutlined from '@ant-design/icons/CopyOutlined'
import { useClipboard, useElementSize } from '@mantine/hooks'
import { App, Button } from 'antd'
import React, { useEffect, useState } from 'react'

const TruncatedExpandableText = ({ text }: { text: string }) => {
  const { message } = App.useApp()
  const { copied, copy } = useClipboard()
  const [showMore, setShowMore] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const { ref, width, height } = useElementSize()

  useEffect(() => {
    if (!showMore && ref && ref.current) {
      setIsTruncated(ref.current.scrollHeight > ref.current.clientHeight)
    }
  }, [showMore, ref.current, height, width])

  const handleCopyClick = async (text: string) => {
    copy(text)
    await message.success(
      <div>
        <strong>Text</strong> copied
      </div>,
    )
  }

  return (
    <div>
      <div
        onClick={() => handleCopyClick(text)}
        className="hover:text-blue-500 cursor-copy"
      >
        <span
          ref={ref}
          title={text}
          className={`relative text-sm select-text w-full ${
            isTruncated ? 'mb-2' : ''
          } ${showMore ? '' : 'text-ellipsis line-clamp-2'}`}
        >
          {text}
        </span>
        <div className="absolute right-2 top-1">
          {copied ? <CheckCircleOutlined /> : <CopyOutlined />}
        </div>
      </div>
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
