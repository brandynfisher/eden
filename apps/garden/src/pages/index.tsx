import PageLayoutDefault from '@/components/Layout/layouts/PageLayoutDefault'
import HomePage from '@/pages/HomePage'
import { ReactNode } from 'react'

export default function Home() {
  return <HomePage />
}

Home.getLayout = function getLayout(page: ReactNode) {
  return <PageLayoutDefault>{page}</PageLayoutDefault>
}
