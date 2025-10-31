'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { agentSchema } from '@/features/agent/agent-form-sheet'
import ConceptCard from '@/features/concepts/components/concept-card'
import CreateConceptView from '@/features/concepts/create-concept-view'
import EditConceptView from '@/features/concepts/edit-concept-view'
import { Agent, Concept2 } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { Plus } from 'lucide-react'
import React, { FC, useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type AgentFormDto = z.infer<typeof agentSchema>

interface ConceptsTabProps {
  form: UseFormReturn<AgentFormDto>
  agent: Agent
}

export const ConceptsTab: FC<ConceptsTabProps> = ({ agent }) => {
  const [concepts, setConcepts] = useState<Concept2[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingConceptId, setEditingConceptId] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const lightboxJustClosedRef = React.useRef(false)
  const editCloseRequestRef = React.useRef<(() => void) | null>(null)
  const createCloseRequestRef = React.useRef<(() => void) | null>(null)

  // Fetch concepts for this agent
  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        // Pass agent ID as query parameter to get all concepts for this agent
        const response = await axios.get<{ concepts: Concept2[] }>(
          `/api/v2/concepts?agent=${agent._id}`,
        )

        // Filter out deleted concepts
        const agentConcepts = (response.data.concepts || []).filter(
          concept => !concept.deleted,
        )
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

  // Listen for lightbox open/close to prevent Dialog from closing
  useEffect(() => {
    const handleLightboxOpen = () => {
      setLightboxOpen(true)
    }

    const handleLightboxClosing = () => {
      setLightboxOpen(false)
      lightboxJustClosedRef.current = true
      // Reset the flag after a short delay
      setTimeout(() => {
        lightboxJustClosedRef.current = false
      }, 100)
    }

    window.addEventListener('lightbox-open', handleLightboxOpen)
    window.addEventListener('lightbox-closing', handleLightboxClosing)
    return () => {
      window.removeEventListener('lightbox-open', handleLightboxOpen)
      window.removeEventListener('lightbox-closing', handleLightboxClosing)
    }
  }, [])

  const handleEditConcept = (conceptId: string) => {
    setEditingConceptId(conceptId)
  }

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false)
    refreshConcepts()
  }

  const handleEditSuccess = () => {
    setEditingConceptId(null)
    refreshConcepts()
  }

  const handleDeleteSuccess = () => {
    setEditingConceptId(null)
    refreshConcepts()
  }

  const refreshConcepts = async () => {
    try {
      // Pass agent ID as query parameter to get all concepts for this agent
      const response = await axios.get<{ concepts: Concept2[] }>(
        `/api/v2/concepts?agent=${agent._id}`,
      )
      // Filter out deleted concepts
      const agentConcepts = (response.data.concepts || []).filter(
        concept => !concept.deleted,
      )
      setConcepts(agentConcepts)
    } catch (error) {
      console.error('Error fetching concepts:', error)
    }
  }

  return (
    <div className="space-y-6">
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
      <Dialog
        open={isCreateModalOpen}
        onOpenChange={open => {
          // Don't close the dialog if lightbox is open or just closed
          if (!open && (lightboxOpen || lightboxJustClosedRef.current)) {
            return
          }
          if (!open && createCloseRequestRef.current) {
            // Request the child component to handle the close (check unsaved changes)
            createCloseRequestRef.current()
            return
          }
          setIsCreateModalOpen(open)
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto p-2 focus:outline-none"
          onEscapeKeyDown={e => {
            // Prevent Dialog from handling Escape when lightbox is open
            if (lightboxOpen) {
              e.preventDefault()
            }
          }}
          onPointerDownOutside={e => {
            // Prevent Dialog from handling outside clicks when lightbox is open
            if (lightboxOpen) {
              e.preventDefault()
            }
          }}
          onInteractOutside={e => {
            // Prevent Dialog from handling outside interactions when lightbox is open
            if (lightboxOpen) {
              e.preventDefault()
            }
          }}
        >
          <CreateConceptView
            onSuccess={handleCreateSuccess}
            onCancel={() => setIsCreateModalOpen(false)}
            onCloseRequestRef={createCloseRequestRef}
            preselectedAgent={agent}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Concept Modal */}
      <Dialog
        open={!!editingConceptId}
        onOpenChange={open => {
          // Don't close the dialog if lightbox is open or just closed
          if (!open && (lightboxOpen || lightboxJustClosedRef.current)) {
            return
          }
          if (!open && editCloseRequestRef.current) {
            // Request the child component to handle the close (check unsaved changes)
            editCloseRequestRef.current()
            return
          }
          if (!open) {
            setEditingConceptId(null)
          }
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto p-2 focus:outline-none"
          onEscapeKeyDown={e => {
            // Prevent Dialog from handling Escape when lightbox is open
            if (lightboxOpen) {
              e.preventDefault()
            }
          }}
          onPointerDownOutside={e => {
            // Prevent Dialog from handling outside clicks when lightbox is open
            if (lightboxOpen) {
              e.preventDefault()
            }
          }}
          onInteractOutside={e => {
            // Prevent Dialog from handling outside interactions when lightbox is open
            if (lightboxOpen) {
              e.preventDefault()
            }
          }}
        >
          {editingConceptId && (
            <EditConceptView
              conceptId={editingConceptId}
              onSuccess={handleEditSuccess}
              onDelete={handleDeleteSuccess}
              onCancel={() => setEditingConceptId(null)}
              onCloseRequestRef={editCloseRequestRef}
              preselectedAgent={agent}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
