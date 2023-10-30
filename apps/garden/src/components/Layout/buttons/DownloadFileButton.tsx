import CircleButton from '@/components/Layout/buttons/CircleButton'
import { downloadFile } from '@/lib/files'
import DownloadOutlined from '@ant-design/icons/DownloadOutlined'
import { App } from 'antd'
import React from 'react'

const DownloadFileButton = ({
  url,
  variant,
  label,
}: {
  url: string
  variant?: 'text'
  label?: string
}) => {
  const { message } = App.useApp()
  const handleClick = async (url: string) => {
    message.destroy()
    message.success(`Downloading file...`)
    await downloadFile(url)
  }

  if (variant === 'text') {
    return (
      <div
        onClick={() => handleClick(url)}
        className="flex items-center gap-2 w-full justify-between"
        title={'Download file'}
      >
        <div>{label}</div>
        <DownloadOutlined className="text-xl" />
      </div>
    )
  }

  return (
    <CircleButton
      title={'Download file'}
      icon={<DownloadOutlined className="text-xl" />}
      onClick={() => handleClick(url)}
    />
  )
}

export default DownloadFileButton
