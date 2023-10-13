import Banner from '@/components/Banners/BaseBanner'
import { useLocalStorage } from '@mantine/hooks'
import { useEffect, useState } from 'react'

const AuthChangeBanner = () => {
  const [shouldShow, setShouldShow] = useState(false)

  const [bannerDismissed, setBannerDismissed] = useLocalStorage<
    boolean | 'auto'
  >({
    key: 'banner::auth-change2--seen',
    defaultValue: false,
  })

  const onCloseHandler = () => {
    setBannerDismissed(true)
    setShouldShow(false)
  }

  useEffect(() => {
    if (typeof bannerDismissed !== 'undefined' && bannerDismissed === false) {
      setShouldShow(true)
    }
  }, [bannerDismissed])

  if (bannerDismissed || !shouldShow) {
    return null
  }

  return (
    <Banner onClose={onCloseHandler} className="bg-orange-100 dark:bg-gray-800">
      <div className="py-2">We've changed our login system!</div>

      {/*<Link href="/sign-up" className="font-bold mb-2">*/}
      {/*  Click here to sign-up for a new account*/}
      {/*</Link>*/}

      <div className="text-xs text-gray-800 dark:text-gray-400 mb-2">
        If you already have an account, your data can be migrated afterwards
      </div>
    </Banner>
  )
}

export default AuthChangeBanner
