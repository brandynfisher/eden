import CustomLayout from '@/components/Layout/CustomLayout'
import HomePage from '@/pages/HomePage'
import { Layout } from 'antd'
import React, { ReactNode } from 'react'

const { Content } = Layout

export default function Home() {
  return <HomePage />
}

Home.getLayout = function getLayout(page: ReactNode) {
  return (
    <CustomLayout>
      <Content className="flex-grow max-w-7xl mx-auto w-full">{page}</Content>
    </CustomLayout>
  )
}
