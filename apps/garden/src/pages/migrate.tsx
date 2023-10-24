import LoadingIndicator from '@/components/LoadingIndicator'
import dynamic from 'next/dynamic'
import React from 'react'

const MigratePageContent = dynamic(
  () => import('@/components/MigratePageContent'),
  {
    loading: () => <LoadingIndicator />,
  },
)

const MigratePage = () => {
  return <MigratePageContent />
}

export default MigratePage
