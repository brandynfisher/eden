import CopyUrlButton from '@/components/CopyUrlButton'
import CircleButton from '@/components/Layout/buttons/CircleButton'
import ShareButton from '@/components/ShareButton'
import { downloadFile } from '@/lib/files'
import { DownloadOutlined } from '@ant-design/icons'
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
      icon: <ShareButton title={'Share Concept'} url={``} />,
    }
    const copyItem = {
      title: 'Copy URL',
      icon: <CopyUrlButton url={``} />,
    }

    const items: ToolButtonItem[] = [
      ...(navigator && !!navigator.share ? [copyItem, shareItem] : [copyItem]),
      {
        title: 'Download',
        icon: <DownloadOutlined className="text-xl" />,
        onClick: async () => {
          await downloadFile(concept.uri, concept._id)
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
