import axios from 'axios'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { SiweMessage } from 'siwe'
import { useAccount, useNetwork, useSignMessage } from 'wagmi'

export const useAuth = () => {
  const { address, connector } = useAccount({
    // If the user disconnects their wallet, reset the auth state
    onDisconnect: async () => {
      await logout()
    },
  })
  const { chain } = useNetwork()
  const { signMessageAsync } = useSignMessage()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [hasCheckedForSession, setHasCheckedForSession] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const chainId = chain?.id

  // Get the user's session status on page load
  useEffect(() => {
    const checkSessionStatus = async () => {
      try {
        const response = await axios.get('/api/session', {
          withCredentials: true,
        })
        const { address: sessionAddress } = response.data
        const isAuth = sessionAddress && sessionAddress === address
        setIsAuthenticated(isAuth || false)
      } catch (error) {
        setIsAuthenticated(false)
      }
    }

    checkSessionStatus()
    setHasCheckedForSession(true)
  }, [])

  // If the user connects a new wallet, reset the auth state
  useEffect(() => {
    const resetAuth = async () => {
      await logout()
    }
    resetAuth()
    address && hasCheckedForSession && authenticate()
  }, [address])

  // Show error message if there is one
  useEffect(() => {
    if (authError) {
      toast.error(authError)
    }
  }, [authError])

  const createChallenge = async () => {
    const isWeb2 = connector && connector.id === 'particle'
    const response = await axios.post('/api/challenge', {
      address,
      isWeb2,
    })
    const { nonce } = response.data
    return nonce
  }

  const login = async (message: string, signature: string) => {
    await axios.post(`/api/login`, {
      address,
      message,
      signature,
    })
  }

  const logout = async () => {
    if (!isAuthenticated) {
      return null
    }
    await axios.get(`/api/logout`)
    setIsAuthenticated(false)
  }

  const authenticate = async () => {
    setAuthError(null)
    if (!address || !chainId) {
      setAuthError('No wallet connected')
      return null
    }

    setIsAuthenticating(true)

    // Create challenge
    let nonce
    try {
      nonce = await createChallenge()
    } catch (error) {
      setAuthError('Failed to create login challenge')
      setIsAuthenticating(false)
      return null
    }

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
    let signature
    try {
      signature = await signMessageAsync({
        message,
      })
    } catch (error) {
      setAuthError('You must sign the login message to continue')
      setIsAuthenticating(false)
      return null
    }

    try {
      await login(message, signature)
      setIsAuthenticated(true)
      setIsAuthenticating(false)
    } catch (error) {
      setAuthError('Failed to login')
      setIsAuthenticating(false)
    }
  }

  return {
    isAuthenticated,
    isAuthenticating,
    authError,
    authenticate,
    logout,
  }
}
