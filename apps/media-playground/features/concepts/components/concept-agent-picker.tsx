'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import SingleAgentSelectorModal from '@/features/sessions/components/single-agent-selector-modal'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent } from '@edenlabs/eden-sdk'
import { X } from 'lucide-react'
import React, { useState } from 'react'

interface ConceptAgentPickerProps {
  selectedAgent?: Agent | null
  onAgentSelect: (agent: Agent | null) => void
  label?: string
  className?: string
}

const ConceptAgentPicker = ({
  selectedAgent,
  onAgentSelect,
  label = 'Agent',
  className,
}: ConceptAgentPickerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleAgentSelect = (agent: Agent) => {
    onAgentSelect(agent)
    setIsModalOpen(false)
  }

  const handleRemoveAgent = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAgentSelect(null)
  }

  return (
    <div className={className}>
      <Label className="text-base font-medium">{label}</Label>
      <div className="mt-2">
        {selectedAgent ? (
          <div className="relative inline-block">
            <div
              className="cursor-pointer group"
              onClick={() => setIsModalOpen(true)}
            >
              <Avatar className="w-16 h-16 ring-2 ring-border hover:ring-primary/50 transition-all">
                <AvatarImage
                  src={
                    selectedAgent.userImage && selectedAgent.userImage.trim()
                      ? getCloudfrontOriginalUrl(selectedAgent.userImage)
                      : undefined
                  }
                  alt={selectedAgent.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-muted text-lg font-medium">
                  {selectedAgent.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={handleRemoveAgent}
            >
              <X className="w-3 h-3" />
            </Button>
            <div className="mt-2 text-center">
              <p className="text-sm font-medium truncate max-w-[80px]">
                {selectedAgent.name}
              </p>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-16 h-16 rounded-full p-0 border-2 border-dashed border-muted-foreground/50 hover:border-primary/50"
            onClick={() => setIsModalOpen(true)}
          >
            <div className="text-center">
              <div className="text-2xl font-light">+</div>
            </div>
          </Button>
        )}
      </div>

      <SingleAgentSelectorModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSelect={handleAgentSelect}
      />
    </div>
  )
}

export default ConceptAgentPicker
