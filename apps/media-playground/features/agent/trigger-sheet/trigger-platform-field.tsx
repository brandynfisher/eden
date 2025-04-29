'use client'

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TriggerCollapsibleFormGroup } from '@/features/agent/trigger-sheet/trigger-collapsible-form-group'
import { CreateTriggerDto } from '@/features/agent/trigger-sheet/trigger-create-sheet'
import { cn } from '@/lib/utils'
import { AllowlistItem } from '@edenlabs/eden-sdk'
import has from 'lodash/has'
import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

interface TriggerPlatformFieldProps {
  form: UseFormReturn<CreateTriggerDto>
  availablePlatforms: string[]
  platform: string
  channels: AllowlistItem[]
}

export const TriggerPlatformField = ({
  form,
  availablePlatforms,
  platform,
  channels,
}: TriggerPlatformFieldProps) => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const hasErrors =
      has(form.formState.errors, 'platform') ||
      has(form.formState.errors, 'channelId')

    if (hasErrors) {
      setIsOpen(true)
    }
  }, [form.formState.errors])

  const trueAvailablePlatforms = ['web', ...availablePlatforms]

  return (
    <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
      <TriggerCollapsibleFormGroup
        isOpen={isOpen}
        label="Platform*"
        tooltip="Select the platform and channel for the task"
      />
      <CollapsibleContent
        className={cn([
          isOpen
            ? 'border border-gray-400/20 border-t-0 rounded-b-lg flex flex-col gap-2'
            : '',
        ])}
      >
        <div className="space-y-4 p-4">
          <FormField
            control={form.control}
            name="platform"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="flex items-center">Platform*</FormLabel>
                <Select
                  onValueChange={value => {
                    field.onChange(value)
                    form.setValue('channelId', '')
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a platform" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {['web', 'discord', 'twitter', 'telegram'].map(platform => (
                      <SelectItem
                        key={platform}
                        value={platform}
                        disabled={!trueAvailablePlatforms.includes(platform)}
                      >
                        {platform}{' '}
                        {!trueAvailablePlatforms.includes(platform) && (
                          <span className="ml-1">
                            (No deployments for this platform)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {!platform ||
            (platform !== 'twitter' && platform !== 'web' && (
              <FormField
                control={form.control}
                name="channelId"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="flex items-center">
                      Channel
                      <span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={channels.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {channels.map(channel => (
                          <SelectItem key={channel.id} value={channel.id}>
                            {channel.note ?? channel.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {channels.length === 0 && (
                      <p className="text-destructive text-sm ml-1">
                        No channels found for this platform
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
