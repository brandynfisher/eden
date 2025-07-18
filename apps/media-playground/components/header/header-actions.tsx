import TaskStatusIndicator from '@/components/alert/task-status-indicator'
import ErrorBoundary from '@/components/error-boundary'
import MannaBalance from '@/components/header/manna-balance'
import LoadingIndicator from '@/components/loading-indicator'
import MyAccountButton from '@/components/navigation/my-account-button'
import { Separator } from '@/components/ui/separator'
import { Suspense } from 'react'

interface HeaderActionsProps {
  showManna?: boolean
  hideMannaMobile?: boolean
  className?: string
}

const HeaderActions = ({
  showManna = true,
  hideMannaMobile = false,
  className = 'ml-auto flex items-center gap-2 h-10',
}: HeaderActionsProps) => {
  return (
    <div className={className}>
      <Suspense fallback={<LoadingIndicator />}>
        <ErrorBoundary>
          <TaskStatusIndicator />
        </ErrorBoundary>
      </Suspense>
      {showManna && (
        <Suspense fallback={<LoadingIndicator />}>
          <div className={hideMannaMobile ? 'hidden sm:block' : ''}>
            <MannaBalance />
          </div>
        </Suspense>
      )}
      <Separator orientation="vertical" className="ml-1 mr-2" />
      <MyAccountButton />
    </div>
  )
}

export default HeaderActions
