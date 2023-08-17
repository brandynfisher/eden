import { requireAuth } from '@/lib/auth'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { App, Button, Input } from 'antd'
import axios from 'axios'
import React, { useContext, useState } from 'react'

const MannaVoucherRedeem = () => {
  const { message } = App.useApp()
  const [voucherCode, setVoucherCode] = useState('')
  const [redeemingVoucher, setRedeemingVoucher] = useState(false)
  const { refetch, isAuthenticated, authenticate } = useContext(UserContext)

  const redeemVoucher = async () => {
    if (!isAuthenticated) {
      await requireAuth(authenticate)
      return
    }
    message.destroy()
    setRedeemingVoucher(true)
    try {
      await axios.post('/api/manna/redeemvoucher', {
        code: voucherCode,
      })

      message.success('Voucher redeemed!')
      refetch.mannaBalance()
    } catch (error) {
      handleAxiosError(error, message)
    }
    setRedeemingVoucher(false)
  }

  return (
    <div>
      <div>
        <h3 className="text-l">Redeem Manna Voucher</h3>
        <Input
          placeholder="Voucher Code"
          value={voucherCode}
          style={{ width: '50%', marginTop: 10, marginBottom: 10 }}
          onChange={e => setVoucherCode(e.target.value)}
        />
      </div>

      <Button
        className="font-mono bg-black text-white h-10"
        onClick={redeemVoucher}
        disabled={redeemingVoucher}
        loading={redeemingVoucher}
      >
        Redeem
      </Button>
    </div>
  )
}

export default MannaVoucherRedeem
