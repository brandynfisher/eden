import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Layout } from 'antd'
import React from 'react'

function CustomLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout>
      <Layout.Header>
        <ConnectButton />
      </Layout.Header>
      <Layout.Content>{children}</Layout.Content>
    </Layout>
  )
}

export default CustomLayout
