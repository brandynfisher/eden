import ConnectButton from '@/components/ConnectButton'
import { App, Button } from 'antd'
import axios from 'axios'
import React, { useState } from 'react'
import { SiweMessage } from 'siwe'
import { useAccount, useNetwork, useSignMessage } from 'wagmi'

const MigratePage = () => {
  const { isConnected, address } = useAccount()
  const { chain } = useNetwork()
  const { signMessageAsync } = useSignMessage()
  const [isTransferring, setIsTransferring] = useState(false)
  const { message: appMessage } = App.useApp()

  const chainId = chain?.id

  const createChallenge = async () => {
    const response = await axios.post('/api/challenge', {
      address,
      isWeb2: false,
    })
    const { nonce } = response.data
    return nonce
  }

  const signMessage = async (nonce: string) => {
    // Create message for signing using ethers
    const siweMessage = new SiweMessage({
      domain: window.location.host,
      address,
      statement:
        'Sign this message to transfer your creations to your active account.',
      uri: window.location.origin,
      version: '1',
      chainId,
      nonce,
    })

    const message = siweMessage.prepareMessage()
    const signature = await signMessageAsync({
      message,
    })
    return {
      message,
      signature,
    }
  }

  const handleTransfer = async () => {
    if (!address) {
      appMessage.error('Please connect your wallet')
      return
    }

    setIsTransferring(true)

    let nonce
    try {
      nonce = await createChallenge()
    } catch (error) {
      appMessage.error('Error creating challenge')
      setIsTransferring(false)
      return
    }

    let sigResponse
    try {
      sigResponse = await signMessage(nonce)
    } catch (error) {
      appMessage.error('Error signing message')
      setIsTransferring(false)
      return
    }

    try {
      await axios.post(`/api/creations/transfer`, {
        address,
        message: sigResponse.message,
        signature: sigResponse.signature,
      })
    } catch (error) {
      appMessage.error('Error transferring creations')
      setIsTransferring(false)
      return
    }

    appMessage.success('Successfully transferred creations')
    setIsTransferring(false)
  }

  return (
    <>
      <h1>Migrate</h1>
      <p>Step 1: Connect your wallet</p>
      <ConnectButton />

      <p>
        Step 2: Sign a message to confirm you wish to migrate to your account
      </p>
      <Button
        disabled={!isConnected}
        loading={isTransferring}
        onClick={handleTransfer}
      >
        Sign Message
      </Button>
    </>
  )
}

export default MigratePage
