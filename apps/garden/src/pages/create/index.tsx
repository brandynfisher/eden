import PageLayoutSidebar from '@/components/Layout/layouts/PageLayoutSidebar'
import CreatePage from '@/pages/create/CreatePage'
import { ReactNode } from 'react'

export default function Create() {
  return <CreatePage />
}

Create.getLayout = function getLayout(page: ReactNode) {
  return <PageLayoutSidebar>{page}</PageLayoutSidebar>
}
