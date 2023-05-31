import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Header } from 'antd/es/layout/layout'
import Link from 'next/link'
import React from 'react'

const LayoutHeader = () => {
  return (
    <Header style={{ display: 'flex', alignItems: 'center' }}>
      <div className="demo-logo">
        <Link href="/">
          <img
            src="/favicon-32x32.png"
            alt="Logo"
            style={{ height: '32px', marginRight: '16px' }}
          />
        </Link>
      </div>
      <div style={{ marginLeft: 'auto' }}>
        {' '}
        <ConnectButton />
      </div>
    </Header>
  )
}

export default LayoutHeader
