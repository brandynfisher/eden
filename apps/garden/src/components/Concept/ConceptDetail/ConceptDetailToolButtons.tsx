import CircleButton from '@/components/Layout/buttons/CircleButton'
import CopyUrlButton from '@/components/Layout/buttons/CopyUrlButton'
import ShareButton from '@/components/Layout/buttons/ShareButton'
import { CONFIG } from '@/lib/config'
import { downloadFileBlob } from '@/lib/files'
import DownloadOutlined from '@ant-design/icons/DownloadOutlined'
import { Concept } from '@edenlabs/eden-sdk'
import { useRouter } from 'next/router'
import { ReactNode, useEffect, useState } from 'react'

type ToolButtonItem = { title: string; icon: ReactNode; onClick?: () => void }

const ConceptDetailToolButtons = ({ concept }: { concept: Concept }) => {
  const router = useRouter()
  const [toolItems, setToolItems] = useState<ToolButtonItem[]>([])

  const getItems = () => {
    const shareItem = {
      title: 'Share Concept',
      icon: (
        <ShareButton
          title={'Share Concept'}
          url={`${CONFIG.NEXT_PUBLIC_HOST}${router.asPath}`}
        />
      ),
    }
    const copyItem = {
      title: 'Copy URL',
      icon: (
        <CopyUrlButton url={`${CONFIG.NEXT_PUBLIC_HOST}${router.asPath}`} />
      ),
    }

    const items: ToolButtonItem[] = [
      ...(navigator && !!navigator.share ? [copyItem, shareItem] : [copyItem]),
      {
        title: 'Download',
        icon: <DownloadOutlined className="text-xl" />,
        onClick: async () => {
          await downloadFileBlob(concept.uri, concept._id)
        },
      },
    ]

    return items
  }

  useEffect(() => {
    setToolItems(getItems())
  }, [router.asPath])

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

export default ConceptDetailToolButtons
