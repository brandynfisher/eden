'use client'

import ModelMiniCard from '@/components/card/model-mini-card'
import ModelSelectorModal from '@/components/modal/model-selector-modal'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { agentSchema } from '@/features/agent/agent-form-sheet'
import ConceptCard from '@/features/concepts/components/concept-card'
import CreateConceptView from '@/features/concepts/create-concept-view'
import { Agent, Concept2 } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { Plus, XIcon } from 'lucide-react'
import { FC, useEffect, useState } from 'react'
import { UseFormReturn, useFieldArray } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type AgentFormDto = z.infer<typeof agentSchema>

interface ConceptsTabProps {
  form: UseFormReturn<AgentFormDto>
  agent: Agent
}

export const ConceptsTab: FC<ConceptsTabProps> = ({ form, agent }) => {
  const [concepts, setConcepts] = useState<Concept2[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const models = useFieldArray({
    control: form.control,
    name: 'models',
  })

  // Fetch concepts for this agent
  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        const response = await axios.get<{ concepts: Concept2[] }>(
          '/api/v2/concepts',
        )
        console.log('All concepts:', response.data.concepts)
        console.log('Current agent._id:', agent._id)

        // Filter concepts by agent
        const agentConcepts = (response.data.concepts || []).filter(concept => {
          if (concept.deleted) return false

          // Handle both populated agent object and agent ID string
          const conceptAgentId =
            typeof concept.agent === 'string'
              ? concept.agent
              : (concept.agent as Agent)?._id

          console.log(
            'Concept:',
            concept.name,
            'Agent ID:',
            conceptAgentId,
            'Match:',
            conceptAgentId === agent._id,
          )
          return conceptAgentId === agent._id
        })
        setConcepts(agentConcepts)
      } catch (error) {
        console.error('Error fetching concepts:', error)
        toast.error('Failed to load concepts')
      } finally {
        setLoading(false)
      }
    }

    fetchConcepts()
  }, [agent._id])

  const handleEditConcept = (conceptId: string) => {
    // Navigate to edit page
    window.open(`/concepts/${conceptId}/edit`, '_blank')
  }

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false)
    // Refresh concepts
    const fetchConcepts = async () => {
      try {
        const response = await axios.get<{ concepts: Concept2[] }>(
          '/api/v2/concepts',
        )
        const agentConcepts = (response.data.concepts || []).filter(concept => {
          if (concept.deleted) return false

          // Handle both populated agent object and agent ID string
          const conceptAgentId =
            typeof concept.agent === 'string'
              ? concept.agent
              : (concept.agent as Agent)?._id

          return conceptAgentId === agent._id
        })
        setConcepts(agentConcepts)
      } catch (error) {
        console.error('Error fetching concepts:', error)
      }
    }
    fetchConcepts()
  }

  return (
    <div className="space-y-6">
      {/* Models Field - moved from Tools */}
      <FormField
        control={form.control}
        name="models"
        render={() => (
          <FormItem className="p-4 bg-secondary rounded-lg">
            <FormLabel>Custom Models</FormLabel>
            <FormDescription>
              Give your agent a unique aesthetic using up to 10 custom models.
            </FormDescription>
            <div>
              {models.fields.map((model, index) => (
                <div
                  key={model.lora}
                  className="relative mb-4 p-4 bg-background rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <div className="space-y-4">
                    <div className="flex items-stretch gap-2 min-h-[82px]">
                      <div className="flex-grow">
                        <ModelMiniCard
                          className="w-full h-full"
                          modelId={model.lora}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="hover:bg-destructive hover:text-destructive-foreground h-auto"
                        size="icon"
                        onClick={() => models.remove(index)}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name={`models.${index}.use_when`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-sm text-muted-foreground">
                              When to use this model
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="e.g., 'when user asks for realistic images' or 'for anime style'"
                                {...field}
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
              <div className="mt-4">
                <ModelSelectorModal
                  className="p-4 md:p-8 w-full"
                  title="Select LoRA Model"
                  description="Pick a LoRA model to add to this agent"
                  currentValue=""
                  selectedIds={models.fields.map(m => m.lora)}
                  onChange={id => {
                    const modelId = typeof id === 'string' ? id : id[0]
                    if (!modelId) return

                    // Check if model already exists
                    if (models.fields.some(m => m.lora === modelId)) {
                      toast.error('This model is already added')
                      return
                    }

                    // Add new model
                    form.setValue('models', [
                      ...models.fields,
                      { lora: modelId, use_when: '' },
                    ])
                  }}
                  trigger={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={models.fields.length >= 10}
                      className="w-full"
                    >
                      Add LoRA Model
                    </Button>
                  }
                />
              </div>
            </div>
          </FormItem>
        )}
      />

      {/* Concepts Section */}
      <div className="p-4 bg-secondary rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-medium">Concepts</h3>
            <p className="text-sm text-muted-foreground">
              Manage concepts available to this agent
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Concept
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : concepts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No concepts created for this agent yet
            </p>
            <Button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Concept
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {concepts.map(concept => (
              <ConceptCard
                key={concept._id}
                concept={concept}
                onClick={() => handleEditConcept(concept._id)}
                showAgent={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Concept Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
          <div className="p-6">
            <CreateConceptView
              onSuccess={handleCreateSuccess}
              preselectedAgent={agent}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
