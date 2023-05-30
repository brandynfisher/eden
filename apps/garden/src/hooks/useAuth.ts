import axios from 'axios'
import { useEffect, useState } from 'react'
import { SiweMessage } from 'siwe'
import { useAccount, useNetwork, useSignMessage } from 'wagmi'

export const useAuth = () => {
  const { address } = useAccount({
    // If the user disconnects their wallet, reset the auth state
    onDisconnect: async () => {
      await logout()
    },
  })
  const { chain } = useNetwork()
  const { signMessageAsync } = useSignMessage()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const chainId = chain?.id

  // If the user connects a new wallet, reset the auth state
  useEffect(() => {
    const resetAuth = async () => {
      await logout()
    }
    resetAuth()
  }, [address])

  const createChallenge = async () => {
    const response = await axios.post('/api/challenge', {
      address,
    })
    const { nonce } = response.data
    return nonce
  }

  const login = async (message: string, signature: string) => {
    const response = await axios.post(`/api/login`, {
      address,
      message,
      signature,
    })
    const { token } = response.data
    return token
  }

  const logout = async () => {
    if (!isAuthenticated) {
      return
    }
    await axios.get(`/api/logout`)
    setIsAuthenticated(false)
  }

  const authenticate = async () => {
    if (!address || !chainId) {
      setAuthError('No wallet connected')
      return
    }

    setIsAuthenticating(true)

    // Create challenge
    const nonce = await createChallenge()

    // Create message for signing using ethers
    const siweMessage = new SiweMessage({
      domain: window.location.host,
      address,
      statement: 'Sign in with Ethereum to the app.',
      uri: window.location.origin,
      version: '1',
      chainId,
      nonce,
    })
    const message = siweMessage.prepareMessage()
    const signature = await signMessageAsync({
      message,
    })
    await login(message, signature)
    setIsAuthenticated(true)
    setIsAuthenticating(false)
  }

  return {
    isAuthenticated,
    isAuthenticating,
    authError,
    authenticate,
  }
}
