import {
  CheckCircleOutlined,
  CopyOutlined,
  DownloadOutlined,
  ExperimentOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import { Creation } from '@eden-labs/eden-sdk'
import { useClipboard } from '@mantine/hooks'
import { App } from 'antd'
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

  const handleCreate = async (creation: Creation) => {
    await router.push('/create', {
      query: {
        generatorName: 'remix',
        parentCreationId: creation._id,
      },
    })
  }

  useEffect(() => {
    const host = window.location.host
    const baseUrl = `${window.location.protocol}//${host}`

    setPageUrl(`${baseUrl}${router.asPath}`)
  }, [router.asPath])

  const items = [
    !navigator.share
      ? {
          title: 'Copy',
          icon: copied ? (
            <CheckCircleOutlined className="text-xl" />
          ) : (
            <CopyOutlined className="text-xl" />
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
      title: 'Create',
      icon: <ExperimentOutlined className="text-xl" />,
      onClick: async () => {
        await handleCreate(creation)
      },
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
