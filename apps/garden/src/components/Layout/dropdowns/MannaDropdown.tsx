import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { UserContext } from '@/providers/UserProvider'
import { InfoCircleOutlined, WalletOutlined } from '@ant-design/icons'
import RedeemIcon from '@mui/icons-material/Redeem'
import { Button, Dropdown } from 'antd'
import { ItemType } from 'antd/es/menu/hooks/useItems'
import React, { useContext } from 'react'

const MannaBalanceInfo = () => {
  const { mannaBalance } = useContext(UserContext)

  return (
    <div>
      <div className="mb-2">
        You have <span className="font-bold">{mannaBalance}</span> Manna
      </div>
      <a
        href="https://docs.eden.art/docs/overview/manna"
        title="Learn about Manna"
        className="text-small hover:dark:text-gray-400"
        target="_blank"
      >
        Learn about Manna
        <InfoCircleOutlined className="ml-1" />
      </a>
    </div>
  )
}

const MannaRefillModalTrigger = () => {
  const { showModal } = useModalContext()

  const onClickHandler = () => {
    showModal(MODAL_TYPES.MANNA_REFILL_MODAL, {})
  }

  return (
    <div onClick={onClickHandler} className="flex items-center gap-2">
      <RedeemIcon />
      Redeem Voucher
    </div>
  )
}

// const MannaBuyInfo = () => {
//   return (
//     <div>
//       <div>Buy Manna</div>
//       <div>1,000 Manna / 0.01 ETH</div>
//       <div>10,000 Manna / 0.1 ETH</div>
//       <div>100,000 Manna / 1 ETH</div>
//     </div>
//   )
// }

const items: ItemType[] = [
  {
    label: <MannaBalanceInfo />,
    key: '0',
  },
  {
    type: 'divider',
  },
  {
    label: <MannaRefillModalTrigger />,
    key: '1',
  },
  // {
  //   label: <MannaBuyInfo />,
  //   key: '2',
  // },
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
      arrow={true}
    >
      <Button
        type="text"
        className="font-mono flex px-2 justify-center items-center"
      >
        <WalletOutlined className="text-black dark:text-white !flex mr-2 text-xl" />
        <div className="text-small text-left" style={{ minWidth: '26px' }}>
          {typeof mannaBalance === 'undefined' ? '---' : mannaBalance}
        </div>
      </Button>
    </Dropdown>
  )
}

export default MannaDropdown
