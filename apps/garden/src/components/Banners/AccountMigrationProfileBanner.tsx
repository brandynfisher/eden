import Banner from '@/components/Banners/BaseBanner'
import Link from 'next/link'

const AccountMigrationProfileBanner = () => {
  return (
    <Banner
      dismissible={false}
      className="bg-green-200 dark:bg-indigo-950 mt-2"
    >
      <Link href="/migrate" className="font-bold">
        Click here to migrate data from your old account(s)
      </Link>
    </Banner>
  )
}

export default AccountMigrationProfileBanner
