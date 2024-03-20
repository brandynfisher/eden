import { Collection } from '@edenlabs/eden-sdk'
import Groups from '@mui/icons-material/Groups'
import { Checkbox, FormGroup } from '@mui/material'
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
        <FormGroup className="px-2.5">
          {items && items.length ? (
            items.map((item: Collection) => (
              <div
                key={item._id}
                className="flex justify-between items-center w-full border-0 border-solid border-b border-b-gray-100 dark:border-b-gray-900 last:border-b-0"
              >
                <Checkbox
                  checked={item.hasItem}
                  disabled={
                    loadingItem !== null && loadingItem._id === item._id
                  }
                  onChange={() => handleItemChange(item)}
                />
                <div className="flex justify-between items-center w-full">
                  {item.name}
                  {item.contributors && item.contributors.length ? (
                    <Chip
                      size="small"
                      className="text-gray-400"
                      clickable={true}
                      label={
                        <div className="flex items-center gap-1">
                          <Groups fontSize="small" /> Shared
                        </div>
                      }
                    />
                  ) : null}
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
