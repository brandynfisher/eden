'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthState } from '@/hooks/use-auth-state'
import { useMe } from '@/hooks/use-me'
import { InstagramLogoIcon } from '@radix-ui/react-icons'
import axios, { AxiosError } from 'axios'
import { useState } from 'react'
import { toast } from 'sonner'

const InstagramHandleInput = () => {
  const { isSignedIn } = useAuthState()
  const { user, invalidate } = useMe({ isAuthenticated: !!isSignedIn })
  const [isLoading, setIsLoading] = useState(false)
  const [handle, setHandle] = useState(user?.instagramHandle || '')

  const handleSave = async () => {
    try {
      setIsLoading(true)
      await axios.post('/api/auth/instagram', { instagramHandle: handle })
      toast.success(`@${handle} has been saved as your Instagram username`, {
        dismissible: true,
        richColors: true,
      })
      await invalidate()
    } catch (error) {
      toast.error(
        // @ts-expect-error: AxiosError type not properly recognized
        (error as AxiosError).response?.data?.message ||
          `Failed to save @${handle} as your Instagram username`,
        {
          dismissible: true,
          richColors: true,
        },
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    try {
      setIsLoading(true)
      await axios.post('/api/auth/instagram', { instagramHandle: '' })
      toast.success(`@${handle} has been removed from your account`, {
        dismissible: true,
        richColors: true,
      })
      await invalidate()
      setHandle('')
    } catch (error) {
      toast.error(`Failed to remove @${handle} from your account`, {
        dismissible: true,
        richColors: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="flex items-center sm:mb-0 w-full sm:w-[250px] shrink-0">
        <div className="shrink-0 border rounded-l-md size-10 items-center justify-center flex bg-muted/40 md:ml-auto">
          <InstagramLogoIcon className="w-4 h-4" />
        </div>
        <Input
          className="rounded-none border-l-transparent rounded-r-md focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-purple-600/40"
          placeholder="Instagram Handle"
          value={handle}
          onChange={e => setHandle(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={isLoading || !handle}
          variant="secondary"
          className="flex-1"
        >
          Save
        </Button>
        {user?.instagramHandle && (
          <Button
            onClick={handleRemove}
            disabled={isLoading}
            variant="destructive"
            className="flex-1"
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  )
}

export default InstagramHandleInput
