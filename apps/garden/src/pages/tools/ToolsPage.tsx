import ApiKeys from '@/components/ApiKeys'
import { KeyOutlined } from '@mui/icons-material'
import { Collapse } from 'antd'
import React from 'react'

const { Panel } = Collapse

const ToolsPage = () => {
  const genExtra = () => (
    <KeyOutlined
      onClick={event => {
        event.stopPropagation()
      }}
    />
  )

  return (
    <div className="w-full grid grid-cols-12">
      <div className="flex flex-col space-y-4 col-span-12 xl:col-span-8 mb-4">
        <Collapse expandIconPosition="start">
          <Panel key={'1'} header={'API Keys'} extra={genExtra()}>
            <ApiKeys />
          </Panel>
        </Collapse>
      </div>
    </div>
  )
}

export default ToolsPage
