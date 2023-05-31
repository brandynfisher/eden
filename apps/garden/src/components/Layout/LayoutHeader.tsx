import AuthModal from '@/components/AuthModal'
import LoginButton from '@/components/LoginButton'
import { Layout } from 'antd'
import Link from 'next/link'
import React from 'react'

const { Header } = Layout

const LayoutHeader = () => {
  const [authModalOpen, setAuthModalOpen] = React.useState(false)
  return (
    <div>
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
          <LoginButton setAuthModalOpen={setAuthModalOpen} />
        </div>
      </Header>
      <AuthModal
        open={authModalOpen}
        onCancel={() => setAuthModalOpen(false)}
      />
    </div>
  )
}

export default LayoutHeader
