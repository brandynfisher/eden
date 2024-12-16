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
import { Agent } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { Edit2Icon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export const agentSchema = z.object({
  name: z.string().min(1).max(42),
  key: z
    .string()
    .min(1)
    .max(42)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: 'Key must only contain lowercase letters, numbers, and dashes.',
    }),
  image: z.string().optional(),
  description: z.string().min(1).max(1000),
  instructions: z.string().min(1),
  discordId: z.string().optional(),
})

type AgentFormDto = z.infer<typeof agentSchema>

type AgentSheetProps = {
  mode: 'create' | 'update'
  agent?: Agent
  onAction: () => void
}

const AgentFormSheet = ({ mode, agent, onAction }: AgentSheetProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const isUpdateMode = mode === 'update'

  const form = useForm<AgentFormDto>({
    resolver: zodResolver(agentSchema),
    defaultValues: isUpdateMode
      ? {
          name: agent?.name,
          key: agent?.username,
          image: agent?.userImage,
          description: agent?.description,
          instructions: agent?.instructions,
          discordId: agent?.discordId ?? '',
        }
      : {},
  })

  const handleSubmit = async (data: AgentFormDto) => {
    try {
      if (isUpdateMode) {
        await axios.patch(`/api/agents/${agent?._id}`, data)
        toast.success('Agent updated successfully', {
          description: `"${data.name}" has been updated successfully`,
          richColors: true,
          dismissible: true,
        })
      } else {
        await axios.post('/api/agents', data)
        toast.success('Agent created successfully', {
          description: `"${data.name}" has been created successfully`,
          richColors: true,
          dismissible: true,
        })
      }
      onAction()
      onOpenChange(false)
    } catch (error) {
      toast.error(
        `${isUpdateMode ? 'Agent update' : 'Agent creation'} failed`,
        {
          description:
            // @ts-ignore
            (error as AxiosError).response?.data?.message ||
            'Unknown Error has occurred',
          richColors: true,
          dismissible: true,
        },
      )
    }
  }

  const onOpenChange = (open: boolean) => {
    setIsOpen(open)
    form.reset()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={isUpdateMode ? '' : 'gap-x-2'}
        >
          {isUpdateMode ? (
            <Edit2Icon size={18} />
          ) : (
            <>
              <PlusIcon className="size-4" />
              <p className="text-sm font-semibold">Create Agent</p>
            </>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="overflow-y-auto w-full sm:!max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>
            {isUpdateMode ? 'Update Agent' : 'Create an Agent'}
          </SheetTitle>
          <SheetDescription>
            {isUpdateMode
              ? 'Update your agent'
              : 'Create an agent to help you with your tasks.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            className="w-full space-y-4 py-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            {/** Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="p-2 bg-secondary rounded-lg">
                  <FormLabel>Display Name*</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="My helpful Agent"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  {!isUpdateMode && (
                    <FormDescription>
                      Friendly Name of your agent. This will be displayed to
                      users.
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />

            {/** Key Field */}
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem className="p-2 bg-secondary rounded-lg">
                  <FormLabel>Name*</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="helpful-agent-1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  {!isUpdateMode && (
                    <FormDescription>
                      Unique name of your agent. This will be used in URLs and
                      in the API.
                      <p>Lowercase letters, numbers, and dashes only.</p>
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />

            {/** Image Field */}
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

            {/** Description Field */}
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

            {/** Instructions Field */}
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

            {/** Discord ID Field */}
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isUpdateMode ? 'Update Agent' : 'Create Agent'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export default AgentFormSheet
