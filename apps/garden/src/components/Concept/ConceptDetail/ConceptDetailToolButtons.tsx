import CopyUrlButton from '@/components/CopyUrlButton'
import CircleButton from '@/components/Layout/buttons/CircleButton'
import ShareButton from '@/components/ShareButton'
import { DownloadOutlined } from '@ant-design/icons'
import { Concept } from '@edenlabs/eden-sdk'
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
    console.error('Error downloading concept:', error)
  }
}

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
          await handleDownload(concept.uri, concept._id)
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
