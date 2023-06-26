import PageLayoutNoSidebar from '@/components/Layout/PageLayoutNoSidebar'
import HomePage from '@/pages/HomePage'
import { ReactNode } from 'react'

export default function Home() {
  return <HomePage />
}

Home.getLayout = function getLayout(page: ReactNode) {
  return <PageLayoutNoSidebar>{page}</PageLayoutNoSidebar>
}
