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
import { Creation } from '@edenlabs/eden-sdk'
import { Dropdown } from 'antd'
import React, { useContext } from 'react'

const CreationCardToolsDropdown = ({ creation }: { creation: Creation }) => {
  const { user } = useContext(UserContext)

  const imageCopyItems = [
    {
      icon: <CopyImageButton url={creation.uri} variant="text" />,
      key: '1-1',
    },
  ]

  const otherTypeCopyItems = [
    {
      icon: (
        <CopyUrlButton url={creation.uri} variant="text" label="File URL" />
      ),
      key: '1-2',
    },
    {
      icon: (
        <CopyUrlButton
          url={`${CONFIG.NEXT_PUBLIC_HOST}/creations/${creation.uri}`}
          variant="text"
          label="Page URL"
        />
      ),
      key: '1-3',
    },
    {
      icon: (
        <CopyUrlButton
          url={`${CONFIG.NEXT_PUBLIC_HOST}/create/creations?presetId=${creation._id}`}
          variant="text"
          label="Preset URL"
        />
      ),
      key: '1-4',
    },
  ]

  const copyItems = isImageUrl(creation.uri)
    ? [...imageCopyItems, ...otherTypeCopyItems]
    : otherTypeCopyItems

  const getCardMenuItems = () => {
    const defaultMenuItems = [
      {
        label: 'Copy...',
        key: '1',
        children: copyItems,
      },
      {
        label: 'Open in...',
        key: '2',
        children: [
          {
            icon: (
              <NewTabLinkButton
                url={`${CONFIG.NEXT_PUBLIC_HOST}/creations/${creation._id}`}
                variant="text"
                label="New Tab"
              />
            ),
            key: '2-1',
          },
        ],
      },
      {
        label: 'Use as...',
        key: '3',
        children: [
          {
            icon: (
              <UseAsPresetButton
                creationId={creation._id}
                variant="text"
                label="Preset"
              />
            ),
            key: '3-1',
          },
        ],
      },
    ]

    const creatorMenuItems =
      user?.userId === creation.user.userId
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
                  icon: creation.private ? (
                    <MakePublicButton
                      creationId={creation._id}
                      variant="text"
                      label="Set Public"
                    />
                  ) : (
                    <MakePrivateButton
                      creationId={creation._id}
                      variant="text"
                      label="Set Private"
                    />
                  ),
                  key: '5-1',
                },
                {
                  icon: (
                    <DeleteButton
                      creationId={creation._id}
                      variant="text"
                      label="Delete"
                    />
                  ),
                  key: '5-2',
                },
              ],
            },
          ]
        : []

    return [
      ...defaultMenuItems,
      ...creatorMenuItems,
      {
        key: '6',
        type: 'divider',
      },
      {
        icon: (
          <DownloadFileButton
            url={creation.uri}
            fileName={creation._id}
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

export default CreationCardToolsDropdown
