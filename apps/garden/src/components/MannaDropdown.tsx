import { UserContext } from '@/providers/UserProvider'
import { InfoCircleOutlined, WalletOutlined } from '@ant-design/icons'
import { Button, Dropdown } from 'antd'
import { ItemType } from 'antd/es/menu/hooks/useItems'
import React, { useContext } from 'react'

const MannaBalanceInfo = () => {
  const { mannaBalance } = useContext(UserContext)

  return (
    <div>
      <div>
        You have <span className="font-bold">{mannaBalance}</span> Manna
      </div>
      <a
        href="https://app.eden.art/how-to-get-manna"
        title="How to get more Manna?"
      >
        Learn how you can get more Manna
        <InfoCircleOutlined className="ml-1" />
      </a>
    </div>
  )
}

const MannaBuyInfo = () => {
  return (
    <div>
      <div>Buy Manna</div>
      <div>1,000 Manna / 0.01 ETH</div>
      <div>10,000 Manna / 0.1 ETH</div>
      <div>100,000 Manna / 1 ETH</div>
    </div>
  )
}

const items: ItemType[] = [
  {
    label: <MannaBalanceInfo />,
    key: '0',
  },
  {
    type: 'divider',
  },
  {
    label: <MannaBuyInfo />,
    key: '2',
  },
]

const MannaDropdown = () => {
  const { mannaBalance, isConnected, isAuthenticated } = useContext(UserContext)

  if (!isConnected || !isAuthenticated) {
    return null
  }

  return (
    <Dropdown
      menu={{
        items,
      }}
      trigger={['click']}
      className="cursor-pointer"
      disabled={!isConnected || !isAuthenticated}
    >
      <Button type="text" className="flex px-2 justify-center items-center">
        <div>
          <WalletOutlined className="text-black dark:text-white flex mr-2 text-xl" />
        </div>
        <div className="text-small text-left" style={{ minWidth: '26px' }}>
          {mannaBalance || '---'}
        </div>
      </Button>
    </Dropdown>
  )
}

export default MannaDropdown
