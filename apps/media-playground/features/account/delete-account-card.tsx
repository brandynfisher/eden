'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import axios from 'axios'
import React, { useState } from 'react'
import { toast } from 'sonner'

const DeleteAccountCard = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleDeleteAccount = async () => {
    setIsLoading(true)
    try {
      const response = await axios.post('/api/account/request-deletion')
      toast.success(
        response.data.message ||
          'Account deletion request submitted successfully.',
      )
      setIsOpen(false)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ||
          'Failed to submit account deletion request.'
        toast.error(errorMessage)
      } else {
        toast.error('An unexpected error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardDescription>
          Permanently delete your account and all associated data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">Delete Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete your account? This action will
                submit a request to our support team to permanently delete your
                account and all associated data. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Confirm Deletion'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default DeleteAccountCard
