import ConnectButton from '@/components/Layout/buttons/ConnectButton'
import { useCreator } from '@/hooks/useCreator'
import { App, Button } from 'antd'
import axios from 'axios'
import Link from 'next/link'
import React, { useState } from 'react'
import { SiweMessage } from 'siwe'
import { useAccount, useNetwork, useSignMessage } from 'wagmi'

const MigratePage = () => {
  const { isConnected, address } = useAccount()
  const { chain } = useNetwork()
  const { signMessageAsync } = useSignMessage()
  const [isTransferring, setIsTransferring] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [transferred, setTransferred] = useState(false)
  const { message: appMessage } = App.useApp()
  const { creator } = useCreator(address || '')

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
      setHasError(true)
      return
    }

    let sigResponse
    try {
      sigResponse = await signMessage(nonce)
    } catch (error) {
      appMessage.error('Error signing message')
      setIsTransferring(false)
      setHasError(true)
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
      setHasError(true)
      return
    }

    appMessage.success('Successfully transferred creations')
    setTransferred(true)
    setIsTransferring(false)
  }

  return (
    <>
      <h1>Migrate</h1>
      <p>Step 1: Connect your wallet</p>
      <ConnectButton />

      {!isConnected ? (
        <></>
      ) : creator ? (
        <>
          <p>
            Step 2: Sign a message to confirm you wish to migrate to your
            account
          </p>
          <Button
            disabled={!isConnected || transferred}
            loading={isTransferring}
            onClick={handleTransfer}
          >
            {!transferred ? 'Sign Message' : 'Success!'}
          </Button>
        </>
      ) : (
        <p>No existing eden account found for the connected wallet.</p>
      )}
      {hasError && (
        <p>
          If you are having trouble migrating your account, please
          <Link href="https://discord.gg/f7a83X4rjd">
            {' '}
            contact us on Discord
          </Link>{' '}
          with your new username and address you are attempting to migrate
        </p>
      )}
    </>
  )
}

export default MigratePage
