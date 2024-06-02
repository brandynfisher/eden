import UseConceptButton from '../Layout/buttons/UseConceptButton'
import { CardData } from '@/components/Card/Card'
import AddToCollectionButton from '@/components/Layout/buttons/AddToCollectionButton'
import CopyImageButton from '@/components/Layout/buttons/CopyImageButton'
import CopyUrlButton from '@/components/Layout/buttons/CopyUrlButton'
import DeleteButton from '@/components/Layout/buttons/DeleteButton'
import DownloadFileButton from '@/components/Layout/buttons/DownloadFileButton'
import ExportConcept from '@/components/Layout/buttons/ExportConceptButton'
import MakePrivateButton from '@/components/Layout/buttons/MakePrivateButton'
import MakePublicButton from '@/components/Layout/buttons/MakePublicButton'
import NewTabLinkButton from '@/components/Layout/buttons/NewTabLinkButton'
import ShareLinkButton from '@/components/Layout/buttons/ShareLinkButton'
import UnpublishButton from '@/components/Layout/buttons/UnpublishButton'
import UseAsPresetButton from '@/components/Layout/buttons/UseAsPresetButton'
import { CONFIG } from '@/lib/config'
import { capitalize, isImageUrl, sanitize } from '@/lib/string'
import { ItemType } from '@/providers/ModalProvider'
import { UserContext } from '@/providers/UserProvider'
import EllipsisOutlined from '@ant-design/icons/EllipsisOutlined'
import { Collection, Concept, Creation, Creator } from '@edenlabs/eden-sdk'
import { Dropdown } from 'antd'
import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

type MenuItem = {
  key: string
  icon?: ReactNode
  label?: string | ReactNode
  children?: MenuItem[]
  type?: string
  disabled?: boolean
}

const getImageCopyMenuItems = (item: Concept | Creation) => {
  const otherTypeCopyItems: MenuItem[] = []
  const imageCopyItems: MenuItem[] = []

  if (item.uri) {
    imageCopyItems.push({
      icon: <CopyImageButton url={item.uri} variant="text" />,
      key: '1-1',
    })

    otherTypeCopyItems.push({
      icon: <CopyUrlButton url={item.uri} variant="text" label="File URL" />,
      key: '1-2',
    })
  }

  return isImageUrl(item.uri)
    ? [...imageCopyItems, ...otherTypeCopyItems]
    : otherTypeCopyItems
}

const getNsfwState = (item: Creation | Concept) => {
  return (
    item.attributes &&
    item.attributes.nsfw_score &&
    item.attributes.nsfw_score > 0.5
  )
}

const getAuthorMenuItems = (
  itemType: ItemType,
  item: CardData,
  onVisibilityChange: ({ isPrivate }: { isPrivate: boolean }) => void,
) => {
  const isNsfw =
    itemType === 'creation' || itemType === 'concept'
      ? getNsfwState(item as Concept | Creation)
      : false

  return [
    {
      key: '5',
      type: 'divider',
    },
    {
      key: '6',
      icon: item.isPrivate ? (
        <MakePublicButton
          itemId={item._id}
          itemType={itemType}
          label="Set Public"
          onChange={onVisibilityChange}
          isNsfw={isNsfw}
        />
      ) : (
        <MakePrivateButton
          itemId={item._id}
          itemType={itemType}
          label="Set Private"
          onChange={onVisibilityChange}
        />
      ),
      disabled: isNsfw,
    },
  ]
}
const getDownloadUrl = (
  item: Creation | Concept,
  user: Creator | undefined,
) => {
  if (!user) {
    return ''
  }

  return item.uri
}
const getDownloadMenuItems = (
  itemType: ItemType,
  item: CardData,
  user: Creator | undefined,
) => {
  const downloadable = itemType === 'creation' || itemType === 'concept'

  if (!downloadable) {
    return []
  }

  const downloadUrl = downloadable
    ? getDownloadUrl(item as Creation | Concept, user)
    : ''

  return [
    {
      key: '7',
      type: 'divider',
    },
    {
      icon: (
        <DownloadFileButton
          itemType={itemType}
          url={downloadUrl}
          fileName={encodeURIComponent(
            `Eden-${capitalize(item.user.username)}-${
              item && item.name
                ? capitalize(sanitize(item.name.slice(0, 128)))
                : '___'
            }-${item._id}`,
          )}
          label="Download"
        />
      ),
      key: '8',
    },
  ]
}

const CardToolsDropdown = ({
  onOpen,
  item,
  itemType,
  onChange,
  pageUrl,
}: {
  onOpen?: Function
  item: CardData | Creator | Collection
  itemType: ItemType
  onChange: (updatedData: CardData | Creator | Collection) => void
  pageUrl: string
}) => {
  const { user, isAuthenticated } = useContext(UserContext)
  const [hasNativeShare, setHasNativeShare] = useState(false)

  useEffect(() => {
    if (navigator && !!navigator.share) {
      setHasNativeShare(true)
    }
  }, [])

  const handleOnVisibilityChange = useCallback(
    (visibilityUpdate: { isPrivate: boolean }) => {
      const itemTyped = item as CardData
      onChange({
        ...itemTyped,
        ...visibilityUpdate,
      })
    },
    [item, onChange],
  )

  const handleDelete = useCallback(() => {
    const itemTyped = item as CardData
    onChange({
      ...itemTyped,
      deleted: true,
    })
  }, [item, onChange])

  const copyItems: MenuItem[] = []

  if (itemType === 'concept' || itemType === 'creation') {
    copyItems.push(...getImageCopyMenuItems(item as Concept | Creation))
  }

  copyItems.push({
    icon: <CopyUrlButton url={pageUrl} variant="text" label="Page URL" />,
    key: '1-3',
  })

  if (itemType === 'creation') {
    copyItems.push({
      icon: (
        <CopyUrlButton
          url={`${CONFIG.NEXT_PUBLIC_HOST}/create/${itemType}s?presetId=${item._id}`}
          variant="text"
          label="Preset URL"
        />
      ),
      key: '1-4',
    })
  }

  const shareItems: MenuItem[] = hasNativeShare
    ? [
        {
          key: '2',
          icon: <ShareLinkButton url={pageUrl} variant="text" label="Share" />,
        },
      ]
    : []

  const getCreatorCardMenuItems = () => {
    const defaultMenuItems: MenuItem[] = [
      {
        label: 'Copy...',
        key: '0',
        children: copyItems,
      },
      {
        key: '1',
        type: 'divider',
      },
      ...shareItems,
      {
        key: '3',
        icon: (
          <NewTabLinkButton url={pageUrl} variant="text" label="To New Tab" />
        ),
      },
    ]

    return [...defaultMenuItems]
  }

  const getCardMenuItems = (item: CardData) => {
    const defaultMenuItems: MenuItem[] = [
      {
        label: 'Copy...',
        key: '0',
        children: copyItems,
      },
      {
        key: '1',
        type: 'divider',
      },
      ...shareItems,
      ...(itemType === 'creation'
        ? [
            {
              key: 'add-to-collection',
              icon: (
                <AddToCollectionButton
                  itemId={item._id}
                  // itemType={itemType}
                  variant="text"
                  label="Add to Collection"
                />
              ),
            },
          ]
        : []),
      {
        key: '3',
        icon: (
          <NewTabLinkButton url={pageUrl} variant="text" label="To New Tab" />
        ),
      },
    ]

    if (itemType === 'creation') {
      defaultMenuItems.push({
        key: '4',
        icon: (
          <UseAsPresetButton
            creationId={item._id}
            variant="text"
            label="Use as Preset"
          />
        ),
      })
    }

    if (itemType === 'concept') {
      defaultMenuItems.push({
        key: '4-1',
        icon: (
          <UseConceptButton
            conceptId={item._id}
            variant="text"
            label="Use Model"
          />
        ),
      })
    }

    const creatorMenuItems: MenuItem[] =
      itemType !== 'creator' && user?.userId === item.user.userId
        ? getAuthorMenuItems(itemType, item, handleOnVisibilityChange)
        : []

    const deleteItem: MenuItem[] =
      user && itemType !== 'creator' && user?.userId === item.user.userId
        ? [
            {
              icon: (
                <DeleteButton
                  itemId={item._id}
                  itemType={itemType}
                  variant="text"
                  label="Delete"
                  onChange={handleDelete}
                />
              ),
              key: '6-2',
            },
          ]
        : []

    const downloadItem: MenuItem[] = isAuthenticated
      ? getDownloadMenuItems(itemType, item, user)
      : []

    const huggingFaceItems: MenuItem[] = []

    if (itemType === 'concept') {
      const conceptItem = item as Concept
      if (!conceptItem.publishedUrl && item.user.userId === user?.userId) {
        huggingFaceItems.push({
          key: '4-2',
          icon: (
            <ExportConcept
              conceptId={item._id}
              label={'Publish to Huggingface'}
            />
          ),
        })
      } else if (conceptItem.publishedUrl) {
        huggingFaceItems.push({
          key: '4-2',
          icon: (
            <NewTabLinkButton
              url={conceptItem.publishedUrl}
              variant="text"
              label="View on Huggingface"
            />
          ),
        })
        if (conceptItem.user.userId === user?.userId) {
          huggingFaceItems.push({
            key: '4-3',
            icon: (
              <UnpublishButton
                conceptId={item._id}
                label="Remove from HuggingFace"
              />
            ),
          })
        }
      }
    }

    return [
      ...defaultMenuItems,
      ...creatorMenuItems,
      ...deleteItem,
      ...downloadItem,
      ...huggingFaceItems,
    ]
  }

  const onItemClick = useCallback(() => {
    onOpen && onOpen(false)
  }, [onOpen])

  return (
    <Dropdown
      trigger={['click']}
      arrow={true}
      placement="bottomRight"
      menu={{
        items:
          itemType === 'creator'
            ? getCreatorCardMenuItems()
            : getCardMenuItems(item as CardData),
        onClick: onItemClick,
      }}
      className="card-tools-dropdown ml-auto"
      onOpenChange={open => {
        onOpen && onOpen(open)
      }}
    >
      <div className="flex items-center cursor-pointer pointer-events-auto">
        <EllipsisOutlined className="text-2xl hover:scale-125 active:scale-125 hover:text-blue-500 transition-all active:text-blue-500 active:brightness-125" />
      </div>
    </Dropdown>
  )
}

export default CardToolsDropdown
