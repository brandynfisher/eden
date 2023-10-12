import CopyImageButton from '@/components/Layout/buttons/CopyImageButton'
import CopyUrlButton from '@/components/Layout/buttons/CopyUrlButton'
import DeleteButton from '@/components/Layout/buttons/DeleteButton'
import DownloadFileButton from '@/components/Layout/buttons/DownloadFileButton'
import MakePrivateButton from '@/components/Layout/buttons/MakePrivateButton'
import MakePublicButton from '@/components/Layout/buttons/MakePublicButton'
import NewTabLinkButton from '@/components/Layout/buttons/NewTabLinkButton'
import UseAsPresetButton from '@/components/Layout/buttons/UseAsPresetButton'
import { CONFIG } from '@/lib/config'
import { isImageUrl } from '@/lib/string'
import { UserContext } from '@/providers/UserProvider'
import { EllipsisOutlined } from '@ant-design/icons'
import { Concept, Creation } from '@edenlabs/eden-sdk'
import { Dropdown } from 'antd'
import React, { ReactNode, useCallback, useContext } from 'react'

type MenuItem = {
  key: string
  icon?: ReactNode
  label?: string | ReactNode
  children?: MenuItem[]
  type?: string
}

const CardToolsDropdown = ({
  item,
  itemType,
  onChange,
}: {
  item: Creation | Concept
  itemType: 'creation' | 'concept'
  onChange: (updatedItem: Creation | Concept) => void
}) => {
  const { user } = useContext(UserContext)

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

  const imageCopyItems: MenuItem[] = [
    {
      icon: <CopyImageButton url={item.uri} variant="text" />,
      key: '1-1',
    },
  ]

  const otherTypeCopyItems: MenuItem[] = [
    {
      icon: <CopyUrlButton url={item.uri} variant="text" label="File URL" />,
      key: '1-2',
    },
    {
      icon: (
        <CopyUrlButton
          url={`${CONFIG.NEXT_PUBLIC_HOST}/${itemType}s/${item._id}`}
          variant="text"
          label="Page URL"
        />
      ),
      key: '1-3',
    },
  ]

  if (itemType === 'creation') {
    otherTypeCopyItems.push({
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

  const copyItems = isImageUrl(item.uri)
    ? [...imageCopyItems, ...otherTypeCopyItems]
    : otherTypeCopyItems

  const getCardMenuItems = () => {
    const defaultMenuItems: MenuItem[] = [
      {
        label: 'Copy...',
        key: '1',
        children: copyItems,
      },
      {
        key: '2',
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
        key: '3',
        icon: (
          <UseAsPresetButton
            creationId={item._id}
            variant="text"
            label="Use as Preset"
          />
        ),
      })
    }

    const hasUserFeatureFlagPrivate =
      user && user.featureFlags && user.featureFlags.includes('private')
    const creatorMenuItems: MenuItem[] =
      hasUserFeatureFlagPrivate && user?.userId === item.user.userId
        ? [
            {
              key: '4',
              type: 'divider',
            },
            {
              label: 'Manage...',
              key: '5',
              children: [
                {
                  icon: item.isPrivate ? (
                    <MakePublicButton
                      itemId={item._id}
                      itemType={itemType}
                      variant="text"
                      label="Set Public"
                      onChange={handleOnVisibilityChange}
                    />
                  ) : (
                    <MakePrivateButton
                      itemId={item._id}
                      itemType={itemType}
                      variant="text"
                      label="Set Private"
                      onChange={handleOnVisibilityChange}
                    />
                  ),
                  key: '5-1',
                },
              ],
            },
          ]
        : []

    return [
      ...defaultMenuItems,
      ...creatorMenuItems,
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
        key: '5-2',
      },
      {
        key: '6',
        type: 'divider',
      },
      {
        icon: (
          <DownloadFileButton
            url={item.uri}
            fileName={item._id}
            variant="text"
            label="Download"
          />
        ),
        key: '7',
      },
    ]
  }

  return (
    <Dropdown
      trigger={['click']}
      arrow={true}
      placement="bottomRight"
      menu={{ items: getCardMenuItems() }}
      className="card-tools-dropdown"
    >
      <div className="flex items-center cursor-pointer pointer-events-auto">
        <EllipsisOutlined className="text-xl hover:scale-125 active:scale-125 hover:text-blue-500 transition-all active:text-blue-500 active:brightness-125" />
      </div>
    </Dropdown>
  )
}

export default CardToolsDropdown
