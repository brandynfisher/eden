import { UserContext } from '@/providers/UserProvider'
import { Button } from 'antd'
import React, { useContext } from 'react'

const LoginButton = ({
  setAuthModalOpen,
}: {
  setAuthModalOpen: (open: boolean) => void
}) => {
  const { isAuthenticated, logout } = useContext(UserContext)
  const handleClick = () => {
    if (isAuthenticated) {
      logout && logout()
    } else {
      setAuthModalOpen(true)
    }
  }
  return (
    <Button
      onClick={handleClick}
      type="primary"
      shape="round"
      size="large"
      block
    >
      {isAuthenticated ? 'Logout' : 'Login'}
    </Button>
  )
}

export default LoginButton
