import { CardData } from '@/components/Card/Card'
import AddToCollectionButton from '@/components/Layout/buttons/AddToCollectionButton'
import CopyImageButton from '@/components/Layout/buttons/CopyImageButton'
import CopyUrlButton from '@/components/Layout/buttons/CopyUrlButton'
import DeleteButton from '@/components/Layout/buttons/DeleteButton'
import DownloadFileButton from '@/components/Layout/buttons/DownloadFileButton'
import MakePrivateButton from '@/components/Layout/buttons/MakePrivateButton'
import MakePublicButton from '@/components/Layout/buttons/MakePublicButton'
import NewTabLinkButton from '@/components/Layout/buttons/NewTabLinkButton'
import ShareLinkButton from '@/components/Layout/buttons/ShareLinkButton'
import UseAsPresetButton from '@/components/Layout/buttons/UseAsPresetButton'
import { CONFIG } from '@/lib/config'
import { isImageUrl } from '@/lib/string'
import { ItemType } from '@/providers/ModalProvider'
import { UserContext } from '@/providers/UserProvider'
import EllipsisOutlined from '@ant-design/icons/EllipsisOutlined'
import { Concept, Creation, Creator } from '@edenlabs/eden-sdk'
import { Dropdown } from 'antd'
import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import UseConceptButton from '../Layout/buttons/UseConceptButton'

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

  imageCopyItems.push({
    icon: <CopyImageButton url={item.uri} variant="text" />,
    key: '1-1',
  })

  otherTypeCopyItems.push({
    icon: <CopyUrlButton url={item.uri} variant="text" label="File URL" />,
    key: '1-2',
  })

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

const getCreatorMenuItems = (
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
          variant="text"
          label="Set Public"
          onChange={onVisibilityChange}
          isNsfw={isNsfw}
        />
      ) : (
        <MakePrivateButton
          itemId={item._id}
          itemType={itemType}
          variant="text"
          label="Set Private"
          onChange={onVisibilityChange}
        />
      ),
      disabled: isNsfw,
    },
  ]
}
const getDownloadUrl = (
  itemType: ItemType,
  item: Creation | Concept,
  user: Creator | undefined,
) => {
  if (!user) {
    return ''
  }

  if (itemType === 'concept' && !user.subscriptionTier) {
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
  const downloadUrl = downloadable
    ? getDownloadUrl(itemType, item as Creation | Concept, user)
    : ''

  if (!downloadable) {
    return []
  }

  return [
    {
      key: '7',
      type: 'divider',
    },
    {
      icon: (
        <DownloadFileButton
          url={downloadUrl}
          fileName={item._id}
          variant="text"
          label="Download"
        />
      ),
      key: '8',
      disabled: !downloadUrl,
    },
  ]
}

const CardToolsDropdown = ({
  onOpen,
  item,
  itemType,
  onChange,
}: {
  onOpen?: Function
  item: CardData
  itemType: ItemType
  onChange: (updatedData: CardData) => void
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
      onChange({
        ...item,
        ...visibilityUpdate,
      })
    },
    [item, onChange],
  )

  const handleDelete = useCallback(() => {
    onChange({
      ...item,
      deleted: true,
    })
  }, [item, onChange])

  const copyItems: MenuItem[] = []

  if (itemType === 'concept' || itemType === 'creation') {
    copyItems.push(...getImageCopyMenuItems(item as Concept | Creation))
  }

  copyItems.push({
    icon: (
      <CopyUrlButton
        url={`${CONFIG.NEXT_PUBLIC_HOST}/${itemType}s/${item._id}`}
        variant="text"
        label="Page URL"
      />
    ),
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
          icon: (
            <ShareLinkButton
              url={`${CONFIG.NEXT_PUBLIC_HOST}/${itemType}s/${item._id}`}
              variant="text"
              label="Share"
            />
          ),
        },
      ]
    : []

  const getCardMenuItems = () => {
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
          <NewTabLinkButton
            url={`${CONFIG.NEXT_PUBLIC_HOST}/${itemType}s/${item._id}`}
            variant="text"
            label="To New Tab"
          />
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
            label="Use Concept"
          />
        ),
      })
    }

    const hasUserFeatureFlagPrivate =
      user && user.featureFlags && user.featureFlags.includes('preview')
    const creatorMenuItems: MenuItem[] =
      hasUserFeatureFlagPrivate && user?.userId === item.user.userId
        ? getCreatorMenuItems(itemType, item, handleOnVisibilityChange)
        : []

    const deleteItem: MenuItem[] =
      user && user?.userId === item.user.userId
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

    return [
      ...defaultMenuItems,
      ...creatorMenuItems,
      ...deleteItem,
      ...downloadItem,
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
      menu={{ items: getCardMenuItems(), onClick: onItemClick }}
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
