import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { UserContext } from '@/providers/UserProvider'
import { InfoCircleOutlined, WalletOutlined } from '@ant-design/icons'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import RedeemIcon from '@mui/icons-material/Redeem'
import { Button, Dropdown } from 'antd'
import { ItemType } from 'antd/es/menu/hooks/useItems'
import Link from 'next/link'
import React, { useContext } from 'react'

const MannaBalanceInfo = () => {
  const { mannaBalance } = useContext(UserContext)

  return (
    <div>
      <div className="mb-2">
        You have <span className="font-bold">{mannaBalance}</span> Manna
      </div>
    </div>
  )
}

const MannaRefillModalTrigger = () => {
  const { showModal } = useModalContext()

  const onClickHandler = () => {
    showModal(MODAL_TYPES.MANNA_REFILL_MODAL, { className: 'modal-small' })
  }

  return (
    <div onClick={onClickHandler} className="flex items-center gap-2">
      <RedeemIcon />
      Redeem Voucher
    </div>
  )
}

const MannaBuyLink = () => {
  return (
    <Link href={'/manna'} className="flex items-center gap-2">
      <AddShoppingCartIcon fontSize="medium" />
      Buy Manna
    </Link>
  )
}

const defaultItems: ItemType[] = [
  {
    label: <MannaBalanceInfo />,
    key: '0',
  },
  {
    label: (
      <Link
        href="https://docs.eden.art/docs/overview/manna"
        title="Learn about Manna"
        className="text-small hover:dark:text-gray-400"
      >
        Learn about Manna
        <InfoCircleOutlined className="ml-1" />
      </Link>
    ),
    key: '1',
  },
  {
    type: 'divider',
  },
  {
    label: <MannaRefillModalTrigger />,
    key: '2',
  },
]

const buyMannaItems: ItemType[] = [
  {
    type: 'divider',
  },
  {
    label: <MannaBuyLink />,
    key: '3',
  },
]

const MannaDropdown = () => {
  const { mannaBalance, isAuthenticated, user } = useContext(UserContext)

  const items =
    user && user.featureFlags && user.featureFlags.includes('preview')
      ? [...defaultItems, ...buyMannaItems]
      : defaultItems

  if (!isAuthenticated) {
    return null
  }

  return (
    <Dropdown
      menu={{
        items,
      }}
      trigger={['click']}
      className="cursor-pointer"
      disabled={!isAuthenticated}
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
