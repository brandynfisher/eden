import LoadingIndicator from '@/components/LoadingIndicator'
import { Collection } from '@edenlabs/eden-sdk'
import Groups from '@mui/icons-material/Groups'
import LockIcon from '@mui/icons-material/Lock'
import { Badge, Checkbox, FormGroup } from '@mui/material'
import Chip from '@mui/material/Chip'
import React, { ReactNode, useState } from 'react'

const Combobox = ({
  items,
  footer,
  hasSearch,
  onItemChange,
}: {
  items?: Collection[]
  footer?: ReactNode | string
  hasSearch?: boolean
  onItemChange?: (item: Collection) => void
}) => {
  const [loadingItem, setLoadingItem] = useState<Collection | null>(null)
  const handleItemChange = async (item: Collection) => {
    setLoadingItem(item)

    if (onItemChange) {
      await onItemChange(item)
    }

    setLoadingItem(null)
  }

  return (
    <div>
      {hasSearch ? <div>search box</div> : null}

      <div className="overflow-auto max-h-[500px]">
        <FormGroup className="px-2">
          {items && items.length ? (
            items.map((item: Collection) => (
              <div
                key={item._id}
                className="relative flex justify-between items-center w-full border-0 border-solid border-b border-b-gray-100 dark:border-b-gray-900 last:border-b-0 cursor-pointer group hover:bg-gray-900 hover:rounded-md"
                onClick={() => handleItemChange(item)}
              >
                <div className="relative">
                  {loadingItem !== null && loadingItem._id === item._id ? (
                    <div className="absolute h-full bg-gray-800 z-10 bg-opacity-50 ml-1 px-1 rounded-full">
                      <LoadingIndicator />
                    </div>
                  ) : null}
                  <Checkbox
                    className={`group-hover:text-blue-500 ${
                      item.hasItem
                        ? '!text-blue-300 !group-hover:text-blue-300'
                        : ''
                    }`}
                    checked={item.hasItem}
                    disabled={
                      loadingItem !== null && loadingItem._id === item._id
                    }
                  />
                </div>
                <div
                  className={`flex justify-between items-center w-full group-hover:text-blue-500 ${
                    item.hasItem ? '!text-blue-300' : ''
                  } `}
                >
                  <div className="flex gap-1 items-center">
                    {item.name}
                    {item.isPrivate ? <LockIcon fontSize="small" /> : null}
                  </div>
                  <div>
                    {item.contributors && item.contributors.length ? (
                      <Chip
                        size="small"
                        className="text-gray-400 mr-4"
                        clickable={true}
                        label={
                          <div className="flex items-center gap-1">
                            <Groups fontSize="small" />{' '}
                            <span className="hidden sm:block">Shared</span>
                          </div>
                        }
                      />
                    ) : null}
                    <Badge
                      badgeContent={item.creationCount}
                      color="primary"
                      className={`mr-4 ${item.hasItem ? '' : 'grayscale'}`}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm">Nothing here yet</div>
          )}
        </FormGroup>
      </div>

      {footer ? footer : null}
    </div>
  )
}

export default Combobox
