'use client'

import GoogleIcon from '@/components/icons/google'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs'
import { OAuthStrategy } from '@clerk/types'
import axios from 'axios'
import { X } from 'lucide-react'
import React from 'react'

const ConnectedAccountsCard = ({
  connectedEmails,
}: {
  connectedEmails: { id: string; email: string; linkedTo: string }[]
}) => {
  const { signIn } = useSignIn()
  const { signUp, setActive } = useSignUp()
  const { signOut } = useClerk()

  if (!signIn || !signUp) return null

  const signInWith = (strategy: OAuthStrategy) => {
    return signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: '/sign-up/sso-callback',
      redirectUrlComplete: '/',
    })
  }

  async function handleSignIn(strategy: OAuthStrategy) {
    if (!signIn || !signUp) return null

    await signOut()

    // If the user has an account in your application, but does not yet
    // have an OAuth account connected to it, you can transfer the OAuth
    // account to the existing user account.
    const userExistsButNeedsToSignIn =
      signUp.verifications.externalAccount.status === 'transferable' &&
      signUp.verifications.externalAccount.error?.code ===
        'external_account_exists'

    if (userExistsButNeedsToSignIn) {
      const res = await signIn.create({ transfer: true })

      if (res.status === 'complete') {
        setActive({
          session: res.createdSessionId,
        })
      }
    }

    // If the user has an OAuth account but does not yet
    // have an account in your app, you can create an account
    // for them using the OAuth information.
    const userNeedsToBeCreated =
      signIn.firstFactorVerification.status === 'transferable'

    if (userNeedsToBeCreated) {
      const res = await signUp.create({
        transfer: true,
      })

      if (res.status === 'complete') {
        setActive({
          session: res.createdSessionId,
        })
      }
    } else {
      // If the user has an account in your application
      // and has an OAuth account connected to it, you can sign them in.
      signInWith(strategy)
    }
  }

  const onRemove = async (id: string) => {
    await axios.post('/api/account', {
      requestType: 'removeEmail',
      emailId: id,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>Your connected accounts.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-2">
        {connectedEmails.map(email => (
          <div
            className="flex items-center gap-x-2 justify-between"
            key={email.id}
          >
            <Badge className="gap-x-2 w-full rounded-md h-10" variant="outline">
              <GoogleIcon size={16} />
              {email.email}
            </Badge>
            <Button
              size="icon"
              variant="destructive"
              type="button"
              onClick={() => onRemove(email.linkedTo)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <button onClick={() => handleSignIn('oauth_google')}>
          Sign in with Google
        </button>
      </CardContent>
    </Card>
  )
}

export default ConnectedAccountsCard
