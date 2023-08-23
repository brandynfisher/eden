import CopyUrlButton from '@/components/CopyUrlButton'
import CircleButton from '@/components/Layout/buttons/CircleButton'
import ShareButton from '@/components/ShareButton'
import { getFileExtension } from '@/lib/getFileExtension'
import {
  DownloadOutlined,
  EllipsisOutlined,
  RetweetOutlined,
} from '@ant-design/icons'
import { Creation } from '@edenlabs/eden-sdk'
import { Dropdown } from 'antd'
import { useRouter } from 'next/router'
import { ReactNode, useEffect, useState } from 'react'

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

const isImage = (creationUri: string) => {
  if (!creationUri) return null
  const extension = getFileExtension(creationUri)
  return extension === 'jpg'
}

type ToolButtonItem = { title: string; icon: ReactNode; onClick?: () => void }

const CreationDetailToolButtons = ({ creation }: { creation: Creation }) => {
  const router = useRouter()
  const [pageUrl, setPageUrl] = useState('')
  const [toolItems, setToolItems] = useState<ToolButtonItem[]>([])

  const handleCreate = async (generator: string | null, creation: Creation) => {
    const query: { presetId: string; generator?: string } = {
      presetId: creation._id,
    }

    if (generator) {
      query['generator'] = generator
    }

    await router.push({
      pathname: '/create/creations',
      query,
    })
  }

  const getItems = () => {
    const shareItem = {
      title: 'Share Creation',
      icon: <ShareButton title={'Share Creation'} url={pageUrl} />,
    }
    const copyItem = {
      title: 'Copy URL',
      icon: <CopyUrlButton url={pageUrl} />,
    }

    const items: ToolButtonItem[] = [
      ...(navigator && !!navigator.share ? [copyItem, shareItem] : [copyItem]),
      {
        title: 'Download',
        icon: <DownloadOutlined className="text-xl" />,
        onClick: async () => {
          await handleDownload(creation.uri, creation._id)
        },
      },
    ]

    // show "Recreate" only for creations with an image output
    if (isImage(creation.uri)) {
      items.push({
        title: 'Recreate',
        icon: <RetweetOutlined className="text-xl" />,
        onClick: async () => {
          await handleCreate('remix', creation)
        },
      })
    }

    // misc / other stuff accumulated under "more button"
    items.push({
      title: 'More...',
      icon: (
        <Dropdown
          trigger={['click']}
          arrow={true}
          placement="topRight"
          menu={{ items: getCreateMenuItems() }}
        >
          <div className="flex items-center justify-center w-full h-full">
            <EllipsisOutlined className="text-xl" />
          </div>
        </Dropdown>
      ),
    })

    return items
  }

  useEffect(() => {
    const baseUrl = `${window.location.protocol}//${window.location.host}`
    setPageUrl(`${baseUrl}${router.asPath}`)
    setToolItems(getItems())
  }, [router.asPath])

  const getCreateMenuItems = () => {
    return [
      {
        label: (
          <div onClick={() => handleCreate(null, creation)}>Use as preset</div>
        ),
        key: '1',
      },
    ]
  }

  return (
    <>
      {toolItems &&
        toolItems.map((item, index) => (
          <CircleButton
            key={index}
            icon={item.icon}
            title={item.title}
            onClick={item.onClick}
          />
        ))}
    </>
  )
}

export default CreationDetailToolButtons
