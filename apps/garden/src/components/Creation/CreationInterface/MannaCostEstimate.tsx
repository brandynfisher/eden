import { LoadingOutlined } from '@ant-design/icons'
import { HelpOutline } from '@mui/icons-material'
import { Popover } from 'antd'
import React from 'react'

const MannaCostEstimate = ({
  isLoading,
  cost,
}: {
  isLoading: boolean
  cost: string | number
}) => {
  return (
    <div className="flex gap-2">
      {(isLoading || cost) && (
        <div className="flex items-center gap-2 font-mono text-gray-400">
          <div className="cursor-default">
            Cost:{' '}
            {isLoading ? (
              <LoadingOutlined />
            ) : (
              <span className="font-bold">{cost}</span>
            )}{' '}
            Manna
          </div>
          <Popover
            content={
              <div>Displays the estimated manna cost for this operation</div>
            }
            title="Manna Cost"
            trigger="click"
          >
            <HelpOutline fontSize="small" className="hover:text-blue-400" />
          </Popover>
        </div>
      )}
    </div>
  )
}

export default MannaCostEstimate
