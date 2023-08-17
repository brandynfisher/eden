import PageLayoutDefault from '@/components/Layout/layouts/PageLayoutDefault'
import MannaPage from '@/pages/manna/MannaPage'
import { ReactNode } from 'react'

export default function Manna() {
  return <MannaPage />
}

Manna.getLayout = function getLayout(page: ReactNode) {
  return <PageLayoutDefault>{page}</PageLayoutDefault>
}
