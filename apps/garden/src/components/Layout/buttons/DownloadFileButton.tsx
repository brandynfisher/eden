import { downloadFile } from '@/lib/files'
import { ItemType } from '@/providers/ModalProvider'
import DownloadOutlined from '@ant-design/icons/DownloadOutlined'
import { App } from 'antd'
import React, { ReactElement } from 'react'

const ButtonElement = ({
  label,
  handleClick,
  isAllowed,
  children,
}: {
  label: string
  handleClick: () => void
  isAllowed: boolean
  children?: ReactElement
}) => {
  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-2 w-full ${
        !isAllowed ? 'text-gray-500' : ''
      }`}
      title={'Download file'}
    >
      {children ? children : null}
      <div>{label}</div>
      <DownloadOutlined className="text-xl ml-auto" />
    </div>
  )
}

const DownloadFileButton = ({
  itemType,
  url,
  fileName,
  label,
}: {
  itemType: ItemType
  url: string
  fileName: string
  label?: string
}) => {
  const { message } = App.useApp()

  const handleClick = async (url: string) => {
    message.destroy()
    message.success(`Downloading file... ${itemType} - ${fileName}`)
    await downloadFile(url, fileName)
  }

  return (
    <ButtonElement
      label={label || ''}
      handleClick={() => handleClick(url)}
      isAllowed={true}
    />
  )
}

export default DownloadFileButton
