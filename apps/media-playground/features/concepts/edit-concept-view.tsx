'use client'

import ConceptAgentPicker from './components/concept-agent-picker'
import ConceptDeleteConfirmationDialog from './components/concept-delete-confirmation-dialog'
import ImageDeleteConfirmationDialog from './components/image-delete-confirmation-dialog'
import FileUploader from '@/components/media/file-uploader'
import { Button } from '@/components/ui/button'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Agent, Concept2 } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const conceptImageSchema = z.object({
  image: z.string().min(1, 'Image is required'),
  usage_instructions: z.string().min(1, 'Usage instructions are required'),
})

const conceptSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be under 100 characters'),
  agent: z.object({ _id: z.string() }).nullable().optional(),
  usage_instructions: z.string().optional(),
  images: z
    .array(conceptImageSchema)
    .min(1, 'At least one image is required')
    .max(25, 'Maximum 25 images allowed'),
})

type ConceptFormDto = z.infer<typeof conceptSchema>

interface EditConceptViewProps {
  conceptId: string
}

const EditConceptView = ({ conceptId }: EditConceptViewProps) => {
  const router = useRouter()
  const [concept, setConcept] = useState<Concept2 | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean
    index: number
    hasContent: boolean
  }>({ open: false, index: -1, hasContent: false })
  const [conceptDeleteConfirmation, setConceptDeleteConfirmation] =
    useState(false)

  const form = useForm<ConceptFormDto>({
    resolver: zodResolver(conceptSchema),
    defaultValues: {
      name: '',
      agent: null,
      usage_instructions: '',
      images: [{ image: '', usage_instructions: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'images',
  })

  // Fetch concept data
  useEffect(() => {
    const fetchConcept = async () => {
      try {
        const response = await axios.get<{ concept: Concept2 }>(
          `/api/v2/concepts/${conceptId}`,
        )
        const conceptData = response.data.concept
        setConcept(conceptData)

        // Populate form with existing data
        const agentId = conceptData.agent
          ? typeof conceptData.agent === 'string'
            ? conceptData.agent
            : (conceptData.agent as Agent)._id
          : null

        form.reset({
          name: conceptData.name,
          agent: agentId ? { _id: agentId } : null,
          usage_instructions: conceptData.usage_instructions || '',
          images:
            conceptData.images.length > 0
              ? conceptData.images
              : [{ image: '', usage_instructions: '' }],
        })

        // Set selected agent for the picker
        if (conceptData.agent) {
          // Check if conceptData.agent is a populated object or just an ID
          if (typeof conceptData.agent === 'string') {
            // It's just an ID, fetch the full agent details
            fetchAgentDetails(conceptData.agent)
          } else {
            // It's already populated, use it directly
            setSelectedAgent(conceptData.agent)
          }
        }
      } catch (error) {
        toast.error('Failed to load concept')
        router.push('/concepts')
      } finally {
        setLoading(false)
      }
    }

    fetchConcept()
  }, [conceptId, form, router])

  const fetchAgentDetails = async (agentId: string) => {
    try {
      const response = await axios.get<{ agent: Agent }>(
        `/api/agents/${agentId}`,
      )
      setSelectedAgent(response.data.agent)
    } catch (error) {
      console.error('Failed to fetch agent details:', error)
    }
  }

  const handleSubmit = async (data: ConceptFormDto) => {
    try {
      const payload = {
        name: data.name,
        agent: selectedAgent ? selectedAgent._id : null,
        usage_instructions: data.usage_instructions || undefined,
        images: data.images,
      }

      await axios.patch(`/api/v2/concepts/${conceptId}`, payload)

      router.push('/concepts')
      toast.success('Concept updated successfully', {
        description: `"${data.name}" has been updated successfully`,
        richColors: true,
        dismissible: true,
      })
    } catch (error) {
      const errorMessage =
        (error as AxiosError<{ message?: string }>).response?.data?.message ||
        (error as AxiosError).message ||
        'Please try again later.'

      toast.error('Concept update failed', {
        description: errorMessage,
        richColors: true,
        dismissible: true,
      })
    }
  }

  const handleDeleteClick = () => {
    setConceptDeleteConfirmation(true)
  }

  const handleConfirmDelete = async () => {
    if (!concept) return

    setIsDeleting(true)
    setConceptDeleteConfirmation(false)
    try {
      await axios.delete(`/api/v2/concepts/${conceptId}`)

      router.push('/concepts')
      toast.success('Concept deleted successfully', {
        description: `"${concept.name}" has been deleted`,
        richColors: true,
        dismissible: true,
      })
    } catch (error) {
      toast.error('Failed to delete concept')
      setIsDeleting(false)
    }
  }

  const addImage = () => {
    if (fields.length < 25) {
      append({ image: '', usage_instructions: '' })
    }
  }

  const removeImage = (index: number) => {
    if (fields.length <= 1) return

    const imageData = form.getValues(`images.${index}`)
    const hasContent = !!(imageData.image || imageData.usage_instructions)

    if (hasContent) {
      setDeleteConfirmation({
        open: true,
        index,
        hasContent: true,
      })
    } else {
      remove(index)
    }
  }

  const confirmDeleteImage = () => {
    if (deleteConfirmation.index >= 0) {
      remove(deleteConfirmation.index)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-40 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Edit Concept
          </h1>
          <p className="text-base text-muted-foreground">
            Update your concept with up to 25 reference images and usage
            instructions for each one.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            {/* Basic Information Section */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Basic Information
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure the name, agent, and general usage instructions for
                  your concept.
                </p>
              </div>

              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Concept Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter a descriptive name for your concept"
                        {...field}
                        className="h-11 text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Agent Field */}
              <ConceptAgentPicker
                selectedAgent={selectedAgent}
                onAgentSelect={agent => {
                  setSelectedAgent(agent)
                  form.setValue('agent', agent ? { _id: agent._id } : null)
                }}
                label="Agent"
                description="If no agent is selected, concept will be available to all of your agents"
              />

              {/* Usage Instructions Field */}
              <FormField
                control={form.control}
                name="usage_instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      General Usage Instructions
                    </FormLabel>
                    <FormControl>
                      <AutosizeTextarea
                        placeholder="Provide general instructions on how this concept should be used (optional)"
                        {...field}
                        className="min-h-[100px] text-base leading-relaxed"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Reference Images Section */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Reference Images
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload up to 25 reference images to train your concept.
                </p>
                <div className="mt-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {fields.length} of 25 images
                  </span>
                </div>
              </div>

              <div className="space-y-8">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border border-border rounded-lg p-6 bg-muted/30"
                  >
                    {/* Desktop: Side by side layout, Mobile: Stacked */}
                    <div className="flex flex-col lg:flex-row lg:gap-8 space-y-6 lg:space-y-0">
                      {/* Image Upload */}
                      <div className="lg:w-80 flex-shrink-0">
                        <FormField
                          control={form.control}
                          name={`images.${index}.image`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-foreground">
                                Reference Image {index + 1} *
                              </FormLabel>
                              <FormControl>
                                <FileUploader
                                  value={field.value}
                                  onChange={field.onChange}
                                  allowedFileTypes={['image']}
                                  maxFiles={1}
                                  className="w-full"
                                  draggable={false}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Description */}
                      <div className="flex-1 lg:flex lg:flex-col lg:justify-start">
                        <FormField
                          control={form.control}
                          name={`images.${index}.usage_instructions`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <FormLabel className="text-sm font-medium text-foreground">
                                  Description *
                                </FormLabel>
                                {/* Delete Button */}
                                {fields.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeImage(index)}
                                    className="text-destructive hover:text-destructive border-destructive/20 h-8"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Remove
                                  </Button>
                                )}
                              </div>
                              <FormControl>
                                <AutosizeTextarea
                                  placeholder="Describe this image and when it should be used. Be specific about visual elements, style, context, or use cases."
                                  {...field}
                                  className="min-h-[120px] text-base leading-relaxed"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Reference Image Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    type="button"
                    onClick={addImage}
                    disabled={fields.length >= 25}
                    className="h-12 px-8 text-base font-medium"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Reference Image
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/concepts')}
                className="h-11 px-8 text-base"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="h-11 px-8 text-base font-medium"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating Concept...
                  </>
                ) : (
                  'Update Concept'
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* Danger Zone - moved to bottom with extra spacing */}
        <div className="mt-16 bg-card border border-destructive/20 rounded-lg p-6 space-y-4">
          <div className="border-b border-destructive/20 pb-4">
            <h2 className="text-xl font-semibold text-destructive">
              Danger Zone
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently delete this concept. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="h-10 px-6"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Concept
                </>
              )}
            </Button>
          </div>
        </div>

        <ImageDeleteConfirmationDialog
          open={deleteConfirmation.open}
          onOpenChange={open =>
            setDeleteConfirmation(prev => ({ ...prev, open }))
          }
          onConfirm={confirmDeleteImage}
          hasContent={deleteConfirmation.hasContent}
        />

        <ConceptDeleteConfirmationDialog
          open={conceptDeleteConfirmation}
          onOpenChange={setConceptDeleteConfirmation}
          onConfirm={handleConfirmDelete}
          concept={concept}
        />
      </div>
    </div>
  )
}

export default EditConceptView
