'use client'

import RedeemVoucherForm from '@/components/form/redeem-voucher-form'
import { Button } from '@/components/ui/button'
import { useAuthState } from '@/hooks/use-auth-state'
import Link from 'next/link'

const LoginOrVoucher = () => {
  const { isSignedIn, hasEden2EarlyAccess } = useAuthState()

  return (
    <>
      {isSignedIn && hasEden2EarlyAccess() ? (
        <>
          <div>Your account has Beta access</div>
          <Button asChild className="mt-2">
            <Link href={'/create'}>Start creating!</Link>
          </Button>
        </>
      ) : isSignedIn ? (
        <>
          <div>Already invited?</div>
          <RedeemVoucherForm />
        </>
      ) : (
        <>
          <div>Already invited?</div>
          <Button asChild variant="outline" className="mt-2">
            <Link href={'/sign-in'}>Click here to login</Link>
          </Button>
        </>
      )}
    </>
  )
}

export default LoginOrVoucher
