import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { App, Button, Input } from 'antd'
import axios from 'axios'
import React, { useContext, useState } from 'react'

const MannaVoucherRedeem = () => {
  const { message } = App.useApp()
  const [voucherCode, setVoucherCode] = useState('')
  const [redeemingVoucher, setRedeemingVoucher] = useState(false)
  const { maybeAuthenticate, refetchMe } = useContext(UserContext)

  const redeemVoucher = async () => {
    if (!(await maybeAuthenticate())) return
    message.destroy()
    setRedeemingVoucher(true)
    try {
      await axios.post('/api/manna/redeemvoucher', {
        code: voucherCode,
      })

      message.success('Voucher redeemed!')
      setVoucherCode('')
      refetchMe()
    } catch (error) {
      handleAxiosError(error, message)
    }
    setRedeemingVoucher(false)
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Input
        className="max-w-xs"
        placeholder="Voucher Code"
        value={voucherCode}
        onChange={e => setVoucherCode(e.target.value)}
      />

      <Button
        className="font-mono bg-black text-white"
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
