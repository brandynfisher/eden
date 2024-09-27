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
import { OAuthStrategy } from '@clerk/types'
import axios from 'axios'
import { X } from 'lucide-react'
import React from 'react'

const ConnectedAccountsCard = ({
  connectedEmails,
}: {
  connectedEmails: { id: string; email: string; linkedTo: string }[]
}) => {
  async function handleSignIn(strategy: OAuthStrategy) {
    try {
      const response = await axios.post(
        'https://oriented-glider-22.clerk.accounts.dev/v1/dev_browser',
      )

      const devBrowserToken = response.data.token

      await axios.post(
        'https://oriented-glider-22.clerk.accounts.dev/v1/me/external_accounts',
        {},
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          params: {
            strategy,
            redirectUrl: 'http://localhost:3000/sign-up/sso-callback',
            __dev_session: devBrowserToken,
          },
        },
      )
    } catch (error) {
      console.log(error)
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
