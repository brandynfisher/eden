import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { Button, Input } from 'antd'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import { toast } from 'react-toastify'

const MannaVoucherRedeem = () => {
  const [voucherCode, setVoucherCode] = useState('')
  const [redeemingVoucher, setRedeemingVoucher] = useState(false)
  const { refetch } = useContext(UserContext)

  const redeemVoucher = async () => {
    setRedeemingVoucher(true)
    try {
      await axios.post('/api/manna/redeemvoucher', {
        code: voucherCode,
      })
      toast.success('Voucher redeemed!')
      refetch.mannaBalance()
    } catch (error) {
      handleAxiosError(error)
    }
    setRedeemingVoucher(false)
  }
  return (
    <>
      <h1 className="text-xl">Redeem Manna Voucher</h1>
      <Input
        placeholder="Voucher Code"
        value={voucherCode}
        style={{ width: '50%', marginTop: 10, marginBottom: 10 }}
        onChange={e => setVoucherCode(e.target.value)}
      />
      <br />
      <Button
        className="font-mono bg-black text-white h-10"
        onClick={redeemVoucher}
        disabled={redeemingVoucher}
        loading={redeemingVoucher}
      >
        Redeem
      </Button>
    </>
  )
}

export default MannaVoucherRedeem
