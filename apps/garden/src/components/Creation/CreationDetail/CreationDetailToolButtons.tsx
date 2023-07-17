import { getFileExtension } from '@/lib/getFileExtension'
import {
  CheckCircleOutlined,
  DownloadOutlined,
  EllipsisOutlined,
  LinkOutlined,
  RetweetOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import { Creation } from '@edenlabs/eden-sdk'
import { useClipboard } from '@mantine/hooks'
import { App, Dropdown } from 'antd'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

const handleDownload = async (url: string, fileName: string) => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('Error downloading creation:', error)
  }
}

const shareNative = async (pageUrl: string) => {
  try {
    await navigator.share({
      title: 'Share Creation',
      text: 'Check out this creation on Eden!',
      url: pageUrl,
    })
  } catch (error) {
    console.error('Error sharing creation:', error)
  }
}

const isImage = (creationUri: string) => {
  if (!creationUri) return null
  const extension = getFileExtension(creationUri)
  return extension === 'jpg'
}

const CreationDetailToolButtons = ({ creation }: { creation: Creation }) => {
  const { message } = App.useApp()
  const router = useRouter()
  const [pageUrl, setPageUrl] = useState('')
  const { copied, copy } = useClipboard({ timeout: 750 })

  const handleCopyUrl = async (pageUrl: string) => {
    await copy(pageUrl)

    message.destroy()
    message.success(`Copied url to clipboard!`)
  }

  const handleShare = async (creation: Creation, pageUrl: string) => {
    await shareNative(pageUrl)
  }

  const handleCreate = async (generator: string | null, creation: Creation) => {
    const query: { presetId: string; generator?: string } = {
      presetId: creation._id,
    }

    if (generator) {
      query['generator'] = generator
    }

    await router.push({
      pathname: '/create',
      query,
    })
  }

  useEffect(() => {
    const baseUrl = `${window.location.protocol}//${window.location.host}`

    setPageUrl(`${baseUrl}${router.asPath}`)
  }, [router.asPath])

  const getCreateMenuItems = (isImage: boolean) => {
    const menuItems = [
      {
        label: (
          <div onClick={() => handleCreate(null, creation)}>Use as preset</div>
        ),
        key: '1',
      },
    ]

    if (isImage) {
      menuItems.push({
        label: (
          <div onClick={() => handleCreate('remix', creation)}>Recreate</div>
        ),
        key: '2',
      })
    }

    return menuItems
  }

  const items = [
    !navigator.share
      ? {
          title: 'Copy URL',
          icon: copied ? (
            <CheckCircleOutlined className="text-xl" />
          ) : (
            <LinkOutlined className="text-xl" />
          ),
          onClick: async () => {
            await handleCopyUrl(pageUrl)
          },
        }
      : {
          title: 'Share',
          icon: <ShareAltOutlined className="text-xl" />,
          onClick: async () => {
            await handleShare(creation, pageUrl)
          },
        },
    {
      title: 'Download',
      icon: <DownloadOutlined className="text-xl" />,
      onClick: async () => {
        await handleDownload(creation.uri, creation._id)
      },
    },
    {
      title: 'Recreate',
      icon: <RetweetOutlined className="text-xl" />,
      onClick: async () => {
        await handleCreate('remix', creation)
      },
    },
    {
      title: 'More...',
      icon: (
        <Dropdown
          trigger={['click']}
          arrow={true}
          placement="topRight"
          menu={{ items: getCreateMenuItems(!!isImage(creation.uri)) }}
        >
          <div className="flex items-center justify-center w-full h-full">
            <EllipsisOutlined className="text-xl" />
          </div>
        </Dropdown>
      ),
    },
  ]

  return (
    <>
      {items.map((item, index) => (
        <div
          key={index}
          onClick={item.onClick}
          title={item.title}
          className="rounded-full hover:bg-gray-200 active:bg-gray-200 hover:dark:bg-gray-800 active:dark:bg-gray-800 h-10 w-10 cursor-pointer flex justify-center"
        >
          {item.icon}
        </div>
      ))}
    </>
  )
}

export default CreationDetailToolButtons
