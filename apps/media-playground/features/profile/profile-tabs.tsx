'use client'

import LoadingIndicator from '@/components/loading-indicator'
import RouterTabs from '@/components/tabs/router-tabs'
import { Suspense } from 'react'

const ProfileTabs = () => {
  return (
    <div>
      <Suspense fallback={<LoadingIndicator />}>
        <RouterTabs />
      </Suspense>
    </div>
  )
}

export default ProfileTabs
