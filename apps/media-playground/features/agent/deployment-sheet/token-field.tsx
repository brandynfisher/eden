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
  placeholder?: string
}

export const TokenField = ({
  form,
  name,
  isDeployed,
  label,
  description,
  isSubmitting,
  placeholder,
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

  const placeholderText = isEditing
    ? placeholder || 'Enter token'
    : 'the-token-is-secret'

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
                type="password"
                placeholder={placeholderText}
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
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
