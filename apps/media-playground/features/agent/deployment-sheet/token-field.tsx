'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { EditIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

interface TokenFieldProps {
  form: UseFormReturn<any>
  label: string
  name: string
  description: string
  isDeployed: boolean
  isSubmitting: boolean
}

export const TokenField = ({
  form,
  name,
  isDeployed,
  label,
  description,
  isSubmitting,
}: TokenFieldProps) => {
  const [isEditing, setIsEditing] = useState(true)

  useEffect(() => {
    if (isDeployed || isSubmitting) {
      setIsEditing(false)
    } else {
      setIsEditing(true)
    }
  }, [isDeployed, isSubmitting])

  const handleEdit = () => {
    if (isEditing) {
      form.setValue(name, '')
    }
    setIsEditing(!isEditing)
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="flex items-center gap-2">
            <FormControl>
              <Input
                type="text"
                placeholder={isEditing ? 'Enter token' : 'the-token-is-secret'}
                disabled={!isEditing}
                {...field}
              />
            </FormControl>
            {isDeployed && (
              <Button type="button" variant="outline" onClick={handleEdit}>
                {isEditing ? (
                  <XIcon className="size-4" />
                ) : (
                  <EditIcon className="size-4" />
                )}
              </Button>
            )}
          </div>
          <FormDescription>
            {description} This must be unique and can only be used by one agent.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
