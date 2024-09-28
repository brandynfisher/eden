'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { UserProfile } from '@clerk/nextjs'
import React from 'react'

const ManageAccountCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Account</CardTitle>
        <CardDescription>Manage your account settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Manage Account</Button>
          </DialogTrigger>
          <DialogContent className="!max-w-[calc(100%-32px)] sm:!max-w-fit !p-0 !border-none !bg-transparent">
            <UserProfile routing="hash" />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default ManageAccountCard
