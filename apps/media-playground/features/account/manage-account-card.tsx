'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import ClerkProfileDialog from '@/features/account/clerk-profile-dialog'
import React from 'react'

const ManageAccountCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Account</CardTitle>
        <CardDescription>Manage your account settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <ClerkProfileDialog />
      </CardContent>
    </Card>
  )
}

export default ManageAccountCard
