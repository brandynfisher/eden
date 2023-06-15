import ApiKeys from '@/components/ApiKeys'
import MannaVoucherRedeem from '@/components/MannaVoucherRedeem'
import { Space } from 'antd'
import { Inter } from 'next/font/google'
import React from 'react'

const inter = Inter({ subsets: ['latin'] })

const ToolsPage = () => {
  return (
    <main className={`flex flex-col min-h-screen ${inter.className}`}>
      <Space direction="vertical">
        <ApiKeys />
        <MannaVoucherRedeem />
      </Space>
    </main>
  )
}

export default ToolsPage
