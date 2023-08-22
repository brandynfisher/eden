import PageLayoutSidebar from '@/components/Layout/layouts/PageLayoutSidebar'
import ScenariosPage from '@/pages/create/scenarios/ScenariosPage'
import { ReactNode } from 'react'

const scenarios = () => {
  return <ScenariosPage />
}

scenarios.getLayout = function getLayout(page: ReactNode) {
  return <PageLayoutSidebar>{page}</PageLayoutSidebar>
}

export default scenarios
