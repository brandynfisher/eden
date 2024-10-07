// import SearchForm from '@/components/form/search-form'
import TaskStatusIndicator from '@/components/alert/task-status-indicator'
import ErrorBoundary from '@/components/error-boundary'
import MannaBalance from '@/components/header/manna-balance'
import LoadingIndicator from '@/components/loading-indicator'
import HeaderNav from '@/components/navigation/header-nav'
import MyAccountButton from '@/components/navigation/my-account-button'
import { Suspense } from 'react'

const Header = () => {
  return (
    <header className="sticky z-50 top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <HeaderNav />
      <div className="ml-auto flex items-center gap-2">
        {/*<SearchForm />*/}
        <Suspense fallback={<LoadingIndicator />}>
          <ErrorBoundary>
            <TaskStatusIndicator />
          </ErrorBoundary>
        </Suspense>
        <Suspense fallback={<LoadingIndicator />}>
          <MannaBalance />
        </Suspense>
        <MyAccountButton />
      </div>
    </header>
  )
}

export default Header
