import Banner from '@/components/Banners/BaseBanner'
import { UserContext } from '@/providers/UserProvider'
import { useLocalStorage } from '@mantine/hooks'
import Link from 'next/link'
import { useContext, useEffect, useState } from 'react'

const AccountMigrationBanner = () => {
  const { user } = useContext(UserContext)
  const [shouldShow, setShouldShow] = useState(false) //@todo: initialize from local storage

  const [bannerDismissed, setBannerDismissed] = useLocalStorage<
    boolean | 'auto'
  >({
    key: 'banner::account-migration--seen',
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
    <Banner
      onClose={onCloseHandler}
      className="bg-green-200 dark:bg-indigo-950"
    >
      <div className="mt-2">
        Welcome to the Garden,{' '}
        <span className="font-bold">{user?.username}</span>!
      </div>

      <Link href="/migrate" className="font-bold my-2" onClick={onCloseHandler}>
        Click here to migrate data from your old account(s)
      </Link>

      <div className="text-xs text-gray-800 dark:text-gray-400 mb-2">
        <span>You can also do this later from your </span>
        <Link href={`/creators/${user?.username}`} className="font-bold">
          profile
        </Link>{' '}
        page.
      </div>
    </Banner>
  )
}

export default AccountMigrationBanner
