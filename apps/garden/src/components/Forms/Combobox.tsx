import { Collection } from '@edenlabs/eden-sdk'
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material'
import React, { ReactNode, useState } from 'react'

const Combobox = ({
  items,
  title,
  footer,
  hasSearch,
  onItemChange,
}: {
  items?: Collection[]
  title?: ReactNode | string
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
      {title ? <h3 className="mb-2">{title}</h3> : null}

      {hasSearch ? <div>search box</div> : null}

      <div className="overflow-auto max-h-[500px]">
        <FormGroup className="px-2.5">
          {items && items.length ? (
            items.map((item: Collection) => (
              <FormControlLabel
                key={item._id}
                control={
                  <Checkbox
                    checked={item.hasItem}
                    disabled={
                      loadingItem !== null && loadingItem._id === item._id
                    }
                  />
                }
                label={item.name}
                onChange={() => handleItemChange(item)}
              />
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
