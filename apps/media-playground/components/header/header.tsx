// import SearchForm from '@/components/form/search-form'
import MannaBalance from '@/components/header/manna-balance'
import LoadingIndicator from '@/components/loading-indicator'
import HeaderNav from '@/components/navigation/header-nav'
import MyAccountButton from '@/components/navigation/my-account-button'
import { Suspense } from 'react'

const Header = () => {
  return (
    <header className="sticky z-50 top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <HeaderNav />
      <div className="ml-auto flex items-center gap-1">
        {/*<SearchForm />*/}
        <Suspense fallback={<LoadingIndicator />}>
          <MannaBalance />
        </Suspense>
        <MyAccountButton />
      </div>
    </header>
  )
}

export default Header
