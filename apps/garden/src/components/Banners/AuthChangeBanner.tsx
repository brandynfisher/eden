import Banner from '@/components/Banners/BaseBanner'
import Link from 'next/link'
import { useState } from 'react'

const AuthChangeBanner = () => {
  const [shouldShow, setShouldShow] = useState(true) //@todo: initialize from local storage

  const onCloseHandler = () => {
    // @todo: set localstorage to announcement:[bannerName]:seen = true
    setShouldShow(false)
  }

  if (!shouldShow) {
    return null
  }

  return (
    <Banner onClose={onCloseHandler} className="bg-orange-100 dark:bg-gray-800">
      <div className="py-2">We've changed our login system!</div>

      <Link href="/sign-up/" className="font-bold mb-2">
        Click here to sign-up for a new account
      </Link>

      <div className="text-xs text-gray-800 dark:text-gray-400 mb-2">
        Your existing data can be migrated afterwards
      </div>
    </Banner>
  )
}

export default AuthChangeBanner
