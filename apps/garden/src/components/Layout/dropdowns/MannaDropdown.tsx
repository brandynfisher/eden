import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { UserContext } from '@/providers/UserProvider'
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined'
import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import RedeemIcon from '@mui/icons-material/Redeem'
import Button from '@mui/material/Button'
import { Dropdown } from 'antd'
import { ItemType } from 'antd/es/menu/hooks/useItems'
import Link from 'next/link'
import React, { useContext } from 'react'

const MannaBalanceInfo = () => {
  const { mannaBalance } = useContext(UserContext)

  return (
    <Link href={'/manna'} className="flex items-center gap-2">
      You have <span className="font-bold">{mannaBalance}</span> Manna
    </Link>
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
    disabled: true,
  },
  {
    label: (
      <a
        href="https://docs.eden.art/docs/overview/manna"
        target="_blank"
        title="Learn about Manna"
        className="text-small hover:dark:text-gray-400"
      >
        Learn about Manna
        <InfoCircleOutlined className="ml-1" />
      </a>
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
  const { mannaBalance, isAuthenticated } = useContext(UserContext)

  const items = [...defaultItems, ...buyMannaItems]

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
      <Button>
        <div className="font-mono flex items-center">
          <AccountBalanceWalletOutlined className="!flex mr-2 text-xl" />
          {typeof mannaBalance === 'undefined' ? '---' : mannaBalance}
        </div>
      </Button>
    </Dropdown>
  )
}

export default MannaDropdown
