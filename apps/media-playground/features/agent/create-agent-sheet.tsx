import FileUploader from '@/components/media/file-uploader'
import { Button } from '@/components/ui/button'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const createAssistantSchema = z.object({
  name: z.string().min(1).max(100),
  key: z.string().min(1).max(100),
  image: z.string().optional(),
  description: z.string().min(1).max(1000),
  instructions: z.string().min(1),
  discordId: z.string().optional(),
})

type CreateAssistantDto = z.infer<typeof createAssistantSchema>

type CreateAssistantSheetProps = {
  onCreated: () => void
}

const CreateAgentSheet = ({ onCreated }: CreateAssistantSheetProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<CreateAssistantDto>({
    resolver: zodResolver(createAssistantSchema),
    defaultValues: {},
  })

  const onSubmit = async (data: CreateAssistantDto) => {
    try {
      await axios.post('/api/agents', data)
      toast.success('Agent created successfully', {
        description: `"${data.name}" has been created successfully`,
        richColors: true,
        dismissible: true,
      })
      onCreated()
      onOpenChange(false)
    } catch (error) {
      toast.error('Agent creation failed', {
        description:
          // @ts-ignore
          (error as AxiosError).response?.data?.message ||
          'Unknown Error has occurred',
        richColors: true,
        dismissible: true,
      })
    }
  }

  const onOpenChange = (open: boolean) => {
    setIsOpen(open)
    form.reset()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button className="gap-x-2" type="button" variant="outline">
          <PlusIcon className="size-4" />
          <p className="text-sm font-semibold">Create Agent</p>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="overflow-y-auto w-full sm:!max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>Create an Agent</SheetTitle>
          <SheetDescription>
            Create an agent to help you with your tasks.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            className="w-full space-y-4 py-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="p-2 bg-secondary rounded-lg">
                  <FormLabel>Display Name*</FormLabel>
                  <FormControl>
                    <Input
                      type={'text'}
                      placeholder="My helpful Agent"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    Friendly Name of your agent. This will be displayed to
                    users.
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem className="p-2 bg-secondary rounded-lg">
                  <FormLabel>Name*</FormLabel>
                  <FormControl>
                    <Input
                      type={'text'}
                      pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                      placeholder="helpful-agent-1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    Unique name of your agent. This will be used in URLs and in
                    the API.
                    <p>Lowercase letters, numbers, and dashes only.</p>
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem className="p-2 bg-secondary rounded-lg">
                  <FormLabel>Profile Image</FormLabel>
                  <FormControl>
                    <Input
                      className={'hidden'}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      value={field.value === null ? '' : field.value || ''}
                    />
                  </FormControl>
                  <FileUploader
                    value={field.value === null ? [] : field.value || []}
                    onChange={field.onChange}
                    allowedFileTypes={['image']}
                    maxFiles={1}
                    allowMultiple={false}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="p-2 bg-secondary rounded-lg">
                  <FormLabel>Description*</FormLabel>
                  <FormControl>
                    <AutosizeTextarea
                      placeholder="Abraham is a helpful agent"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem className="p-2 bg-secondary rounded-lg">
                  <FormLabel>Instructions*</FormLabel>
                  <FormControl>
                    <AutosizeTextarea
                      placeholder="Instruct your agent how to act"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discordId"
              render={({ field }) => (
                <FormItem className="p-2 bg-secondary rounded-lg">
                  <FormLabel>Discord ID (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter the Discord ID of your agent"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <SheetFooter>
              <Button
                type="submit"
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Create Agent
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export default CreateAgentSheet
