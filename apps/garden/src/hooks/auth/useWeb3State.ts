import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

export const useWeb3State = () => {
  const { address, isConnected, isConnecting } = useAccount()
  const [isDefinitelyConnected, setIsDefinitelyConnected] = useState(false)
  useEffect(() => {
    if (isConnected) {
      setIsDefinitelyConnected(true)
    } else {
      setIsDefinitelyConnected(false)
    }
  }, [address])

  return {
    address,
    isConnected: isDefinitelyConnected,
    isConnecting,
  }
}
