/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormMessage } from '@/components/ui/form'
import { FormDescription, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PlusIcon } from 'lucide-react'
import { TrashIcon } from 'lucide-react'
import { UseFieldArrayReturn, UseFormReturn } from 'react-hook-form'

interface ChannelsFieldProps {
  name: string
  label: string
  description: string
  allowList: UseFieldArrayReturn<any>
  form: UseFormReturn<any>
}

export const ChannelsField = ({
  name,
  label,
  description,
  allowList,
  form,
}: ChannelsFieldProps) => {
  return (
    <div className="space-y-4 mt-8">
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-medium">{label}</h4>
        <FormDescription>{description}</FormDescription>
      </div>
      {allowList.fields.map((field, index) => (
        <div key={field.id} className="flex gap-2">
          <FormField
            control={form.control}
            name={`${name}.${index}.id`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Channel ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${name}.${index}.note`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Note (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => allowList.remove(index)}
            className="flex-shrink-0"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => allowList.append({ id: '', note: '' })}
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add
      </Button>
    </div>
  )
}
