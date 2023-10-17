import PageLayoutSidebar from '@/components/Layout/layouts/PageLayoutSidebar'
import HomePage from '@/pages/HomePage'
import { AppProps } from 'next/app'

export default function Home() {
  return <HomePage />
}

Home.getLayout = (page: AppProps['pageProps']) => (
  <PageLayoutSidebar>{page}</PageLayoutSidebar>
)
