import { UserContext } from '@/providers/UserProvider'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button, Modal } from 'antd'
import React, { useContext } from 'react'

function AuthModal({
  open,
  onCancel,
}: {
  open: boolean
  onCancel: () => void
}) {
  const { isConnected, isAuthenticating, isAuthenticated, authenticate } =
    useContext(UserContext)
  return (
    <Modal title="Authenticate" open={open} footer={null} onCancel={onCancel}>
      <p>First, connect your wallet:</p>
      {isConnected ? <p>Connected!</p> : <ConnectButton />}
      <p>Then, authenticate:</p>
      {isAuthenticated ? (
        <p>Authenticated!</p>
      ) : (
        <Button
          disabled={!isConnected || isAuthenticating}
          loading={isAuthenticating}
          onClick={authenticate}
        >
          {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
        </Button>
      )}
    </Modal>
  )
}

export default AuthModal
