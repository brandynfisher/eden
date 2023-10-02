import CircleButton from '@/components/Layout/buttons/CircleButton'
import CopyImageButton from '@/components/Layout/buttons/CopyImageButton'
import CopyUrlButton from '@/components/Layout/buttons/CopyUrlButton'
import ShareButton from '@/components/Layout/buttons/ShareButton'
import { downloadFile } from '@/lib/files'
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

const isImage = (creationUri: string) => {
  if (!creationUri) return null
  const extension = getFileExtension(creationUri)
  return extension === 'jpg'
}

type ToolButtonItem = { title: string; icon: ReactNode; onClick?: () => void }

const CreationDetailToolButtons = ({ creation }: { creation: Creation }) => {
  const router = useRouter()
  const [toolItems, setToolItems] = useState<ToolButtonItem[]>([])

  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

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
      icon: <ShareButton title={'Share Creation'} url={currentUrl} />,
    }
    const copyItem = {
      title: 'Copy URL',
      icon: <CopyUrlButton url={currentUrl} />,
    }

    const copyImageItem = {
      title: 'Copy Image',
      icon: <CopyImageButton url={creation.uri} />,
    }

    const items: ToolButtonItem[] = [
      ...(navigator && !!navigator.share
        ? [copyItem, copyImageItem, shareItem]
        : [copyItem, copyImageItem]),
      {
        title: 'Download',
        icon: <DownloadOutlined className="text-xl" />,
        onClick: async () => {
          await downloadFile(creation.uri, creation._id)
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
