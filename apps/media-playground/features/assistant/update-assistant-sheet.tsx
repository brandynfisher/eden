import FileUploader from '@/components/media/file-uploader'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
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
import { Textarea } from '@/components/ui/textarea'
import { Agent } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { Edit2Icon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const updateAssistantSchema = z.object({
  name: z.string(),
  key: z.string(),
  image: z.string().optional(),
  description: z.string(),
  instructions: z.string(),
  discordId: z.string().optional(),
})

type UpdateAssistantDto = z.infer<typeof updateAssistantSchema>

type UpdateAssistantSheetProps = {
  assistant: Agent
  onUpdate: () => void
}

const UpdateAssistantSheet = ({
  assistant,
  onUpdate,
}: UpdateAssistantSheetProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<UpdateAssistantDto>({
    resolver: zodResolver(updateAssistantSchema),
    defaultValues: {
      name: assistant.name,
      key: assistant.key,
      image: assistant.image,
      description: assistant.description,
      instructions: assistant.instructions,
      discordId: assistant.discordId,
    },
  })

  const onSubmit = async (data: UpdateAssistantDto) => {
    try {
      await axios.patch(`/api/assistants/${assistant._id}`, data)
      toast.success('Assistant updated successfully', {
        description: `"${data.name}" has been updated successfully`,
        richColors: true,
        dismissible: true,
      })
      onUpdate()
      onOpenChange(false)
    } catch (error) {
      toast.error('Assistant update failed', {
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
        <Button variant="outline" size="icon">
          <Edit2Icon size={18} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="overflow-y-auto w-full sm:!max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>Update Assistant</SheetTitle>
          <SheetDescription>Update your assistant</SheetDescription>
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
                  <FormLabel>Name (Friendly Name)</FormLabel>
                  <FormControl>
                    <Input placeholder="Abraham" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem className="p-2 bg-secondary rounded-lg">
                  <FormLabel>Key (Unique Key)</FormLabel>
                  <FormControl>
                    <Input placeholder="Abraham" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem className="p-2 bg-secondary rounded-lg">
                  <FormLabel>Photo</FormLabel>
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Abraham is a helpful assistant"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem className="p-2 bg-secondary rounded-lg">
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Instruct your assistant how to act"
                      {...field}
                    />
                  </FormControl>
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
                      placeholder="Enter the Discord ID of your assistant"
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
                Update Assistant
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export default UpdateAssistantSheet
