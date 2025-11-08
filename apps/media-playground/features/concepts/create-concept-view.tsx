'use client'

import ConceptAgentPicker from './components/concept-agent-picker'
import ImageDeleteConfirmationDialog from './components/image-delete-confirmation-dialog'
import UnsavedChangesDialog from './components/unsaved-changes-dialog'
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
import { Agent, ConceptCreateArguments } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
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

interface CreateConceptViewProps {
  onSuccess?: () => void
  onCancel?: () => void
  onCloseRequestRef?: React.MutableRefObject<(() => void) | null>
  preselectedAgent?: Agent | null
}

const CreateConceptView = ({
  onSuccess,
  onCancel,
  onCloseRequestRef,
  preselectedAgent,
}: CreateConceptViewProps = {}) => {
  const router = useRouter()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(
    preselectedAgent || null,
  )
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean
    index: number
    hasContent: boolean
  }>({ open: false, index: -1, hasContent: false })
  const [unsavedChangesConfirmation, setUnsavedChangesConfirmation] =
    useState(false)

  const form = useForm<ConceptFormDto>({
    resolver: zodResolver(conceptSchema),
    defaultValues: {
      name: '',
      agent: preselectedAgent ? { _id: preselectedAgent._id } : null,
      usage_instructions: '',
      images: [{ image: '', usage_instructions: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'images',
  })

  const handleSubmit = async (data: ConceptFormDto) => {
    try {
      const payload: ConceptCreateArguments = {
        name: data.name,
        agent: selectedAgent?._id,
        usage_instructions: data.usage_instructions || undefined,
        images: data.images,
      }

      await axios.post('/api/v2/concepts', payload)

      toast.success('Concept created successfully', {
        description: `"${data.name}" has been created successfully`,
        richColors: true,
        dismissible: true,
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/concepts')
      }
    } catch (error) {
      const errorMessage =
        (error as AxiosError<{ message?: string }>).response?.data?.message ||
        (error as AxiosError).message ||
        'Please try again later.'

      toast.error('Concept creation failed', {
        description: errorMessage,
        richColors: true,
        dismissible: true,
      })
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

  const handleCancelClick = useCallback(() => {
    if (form.formState.isDirty) {
      setUnsavedChangesConfirmation(true)
    } else {
      if (onCancel) {
        onCancel()
      } else {
        router.push('/concepts')
      }
    }
  }, [form.formState.isDirty, onCancel, router])

  const confirmCancel = useCallback(() => {
    setUnsavedChangesConfirmation(false)
    if (onCancel) {
      onCancel()
    } else {
      router.push('/concepts')
    }
  }, [onCancel, router])

  // Handle close requests from parent (Dialog X button or Escape)
  useEffect(() => {
    if (onCloseRequestRef) {
      onCloseRequestRef.current = handleCancelClick
    }
    return () => {
      if (onCloseRequestRef) {
        onCloseRequestRef.current = null
      }
    }
  }, [onCloseRequestRef, handleCancelClick])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Create New Concept
          </h1>
          <p className="text-base text-muted-foreground">
            Create a concept with up to 25 reference images and usage
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
                  {preselectedAgent
                    ? 'Configure the name and general usage instructions for your concept.'
                    : 'Configure the name, agent, and general usage instructions for your concept.'}
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
              {!preselectedAgent && (
                <ConceptAgentPicker
                  selectedAgent={selectedAgent}
                  onAgentSelect={agent => {
                    setSelectedAgent(agent)
                    form.setValue('agent', agent ? { _id: agent._id } : null)
                  }}
                  label="Agent"
                  description="If no agent is selected, concept will be available to all of your agents"
                />
              )}

              {/* Usage Instructions Field */}
              <FormField
                control={form.control}
                name="usage_instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Description
                    </FormLabel>
                    <FormControl>
                      <AutosizeTextarea
                        placeholder="Briefly describe how your agent should use this concept"
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
                                  placeholder="Briefly describe the image or how it should be used."
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
                onClick={handleCancelClick}
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
                    Creating Concept...
                  </>
                ) : (
                  'Create Concept'
                )}
              </Button>
            </div>
          </form>
        </Form>

        <ImageDeleteConfirmationDialog
          open={deleteConfirmation.open}
          onOpenChange={open =>
            setDeleteConfirmation(prev => ({ ...prev, open }))
          }
          onConfirm={confirmDeleteImage}
          hasContent={deleteConfirmation.hasContent}
        />

        <UnsavedChangesDialog
          open={unsavedChangesConfirmation}
          onOpenChange={setUnsavedChangesConfirmation}
          onConfirm={confirmCancel}
        />
      </div>
    </div>
  )
}

export default CreateConceptView
