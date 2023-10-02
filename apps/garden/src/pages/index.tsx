import PageLayoutFullWidth from '@/components/Layout/layouts/PageLayoutFullWidth'
import HomePage from '@/pages/HomePage'
import { AppProps } from 'next/app'

export default function Home() {
  return <HomePage />
}

Home.getLayout = (page: AppProps['pageProps']) => (
  <PageLayoutFullWidth>{page}</PageLayoutFullWidth>
)
