import ModelMiniCard from '@/components/card/model-mini-card'
import FileUploader from '@/components/media/file-uploader'
import ModelSelectorModal from '@/components/modal/model-selector-modal'
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
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { PlusIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const createAssistantSchema = z.object({
  name: z.string(),
  key: z.string(),
  image: z.string().optional(),
  description: z.string(),
  instructions: z.string(),
  discordId: z.string().optional(),
  modelId: z.string().optional(),
})

type CreateAssistantDto = z.infer<typeof createAssistantSchema>

type CreateAssistantSheetProps = {
  onCreated: () => void
}

const CreateAssistantSheet = ({ onCreated }: CreateAssistantSheetProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const form = useForm<CreateAssistantDto>({
    resolver: zodResolver(createAssistantSchema),
    defaultValues: {
      name: '',
      key: '',
      description: '',
      instructions: '',
      discordId: '',
      modelId: '',
    },
  })

  const onSubmit = async (data: CreateAssistantDto) => {
    try {
      await axios.post('/api/assistants', data)
      toast.success('Assistant created successfully', {
        description: `"${data.name}" has been created successfully`,
        richColors: true,
        dismissible: true,
      })
      onCreated()
      onOpenChange(false)
    } catch (error) {
      toast.error('Assistant creation failed', {
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
          <p className="text-sm font-semibold">Create Assistant</p>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="overflow-y-auto w-full sm:!max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>Create an Assistant</SheetTitle>
          <SheetDescription>
            Create an assistant to help you with your tasks.
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
              name="modelId"
              render={({ field }) => (
                <FormItem className="p-2 bg-secondary rounded-lg">
                  <FormLabel>LoRa (Optional)</FormLabel>
                  <div>
                    {field.value && (
                      <div className="relative mb-2">
                        <ModelMiniCard modelId={field.value}>
                          <Button
                            type="button"
                            variant="ghost"
                            className="absolute h-[calc(100%-16px)] top-2 right-2 hover:bg-destructive hover:text-destructive-foreground"
                            size="icon"
                            onClick={e => {
                              e.stopPropagation()
                              field.onChange('')
                            }}
                          >
                            <XIcon className="size-4" />
                          </Button>
                        </ModelMiniCard>
                      </div>
                    )}
                    <ModelSelectorModal
                      className="p-4 md:p-8 w-full"
                      title="Select model"
                      description="Pick a model to use as a lora"
                      base_model="flux-dev"
                      currentValue={field.value || ''}
                      onChange={field.onChange}
                      trigger={
                        <Button type="button" variant="outline">
                          {field.value ? 'Change LoRa' : 'Select LoRa'}
                        </Button>
                      }
                    />
                  </div>
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
                Create Assistant
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export default CreateAssistantSheet
