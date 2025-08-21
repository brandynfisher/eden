'use client'

import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Thought } from '@edenlabs/eden-sdk'
import { Brain, ChevronDown, ChevronRight } from 'lucide-react'
import React, { useState } from 'react'

interface ThoughtBlockProps {
  thought: Thought[]
  className?: string
}

export const ThoughtBlock: React.FC<ThoughtBlockProps> = ({
  thought,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  if (!thought || thought.length === 0) {
    return null
  }

  return (
    <div className={cn('mb-4', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit h-auto p-2 text-muted-foreground hover:text-foreground"
          >
            <Brain className="h-4 w-4 mr-2" />
            <span className="text-sm">Reasoning traces ({thought.length})</span>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 ml-1" />
            ) : (
              <ChevronRight className="h-4 w-4 ml-1" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="border rounded-lg bg-muted/20 overflow-hidden">
            <ScrollArea className="max-h-[400px]">
              <div className="p-4 space-y-4">
                {thought.map((thought_block, index) => (
                  <div
                    key={index}
                    className="border-l-2 border-muted-foreground/30 pl-4"
                  >
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Thinking Block {index + 1}
                    </div>
                    <div className="text-sm whitespace-pre-wrap text-foreground/80">
                      {thought_block.thinking}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export default ThoughtBlock
