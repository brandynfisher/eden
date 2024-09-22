'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import UserAvatar from '@/components/user/user-avatar'
import { useAuthState } from '@/hooks/use-auth-state'
import axios from 'axios'
import React from 'react'
import { toast } from 'sonner'

const ProfileImageCard = () => {
  const { user } = useAuthState()

  const avatarRef = React.useRef<HTMLInputElement>(null)
  const [selectedAvatar, setSelectedAvatar] = React.useState<File | null>(null)
  const [isUpdating, setIsUpdating] = React.useState(false)

  const avatarUrl = React.useMemo(() => {
    if (!selectedAvatar) return user?.userImage
    return URL.createObjectURL(selectedAvatar)
  }, [selectedAvatar, user?.userImage])

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]

      if (file.size > 1024 * 1024 * 10) {
        toast.error('Image must be less than 10MB')
        setSelectedAvatar(null)
        return
      }

      setSelectedAvatar(file)
    }
  }

  const onSubmit = async () => {
    if (!selectedAvatar) {
      toast.error('Please select an image', {
        dismissible: true,
        richColors: true,
      })
      return
    }

    setIsUpdating(true)
    try {
      const base64Data = await new Promise(resolve => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(selectedAvatar)
      })

      await axios.post('/api/account', {
        requestType: 'updateProfileImage',
        file: base64Data,
      })
      toast.success('Profile image updated successfully', {
        dismissible: true,
        richColors: true,
      })
    } catch (error) {
      toast.error('Failed to update profile image', {
        dismissible: true,
        richColors: true,
      })
    }
    setIsUpdating(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Image</CardTitle>
        <CardDescription>Your profile image.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-x-4">
        <UserAvatar
          image={avatarUrl ?? user?.userImage}
          name={user?.username}
          variant="large"
        />

        <Input
          className="hidden"
          type="file"
          accept="image/png, image/jpeg, image/jpg"
          onChange={handleAvatarSelect}
          ref={avatarRef}
        />

        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => avatarRef.current?.click()}
        >
          Upload image
        </Button>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button disabled={isUpdating} onClick={onSubmit}>
          Save
        </Button>
      </CardFooter>
    </Card>
  )
}

export default ProfileImageCard
