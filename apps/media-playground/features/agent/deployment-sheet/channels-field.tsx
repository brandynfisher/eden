/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormMessage } from '@/components/ui/form'
import { FormDescription, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PlusIcon } from 'lucide-react'
import { TrashIcon } from 'lucide-react'
import { ArrayPath, UseFieldArrayReturn, UseFormReturn } from 'react-hook-form'

type ChannelField = {
  id: string
  note?: string
}

type FormValues = {
  token: string
  allowedChannels?: ChannelField[]
  readAccessChannels?: ChannelField[]
  allowedTopics?: ChannelField[]
}

interface ChannelsFieldProps<T extends FormValues, K extends ArrayPath<T>> {
  name: K
  type: 'channel' | 'topic'
  label: string
  description: string
  allowList: UseFieldArrayReturn<T, K, 'id'>
  form: UseFormReturn<T>
}

export const ChannelsField = <T extends FormValues, K extends ArrayPath<T>>({
  name,
  label,
  description,
  type,
  allowList,
  form,
}: ChannelsFieldProps<T, K>) => {
  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-medium">{label}</h4>
        <FormDescription>{description}</FormDescription>
      </div>
      {allowList.fields.map((field, index) => (
        <div key={field.id} className="flex gap-2">
          <FormField
            control={form.control}
            name={`${String(name)}.${index}.id` as any}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    placeholder={`${
                      type === 'channel' ? 'Channel ID' : 'Topic'
                    }`}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${String(name)}.${index}.note` as any}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Note (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {allowList.fields.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => allowList.remove(index)}
              className="flex-shrink-0"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => allowList.append({ id: '', note: '' } as any)}
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add
      </Button>
    </div>
  )
}
