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
      <div className="border rounded-lg bg-muted/20 overflow-hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-3 h-auto text-left hover:bg-muted/40"
            >
              <div className="flex items-center">
                <Brain className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">{thought[0].title}</span>
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t">
              <ScrollArea className="h-[400px] w-full">
                <div className="p-4 space-y-4">
                  {thought.map((thought_block, index) => (
                    <div
                      key={index}
                      className="text-sm whitespace-pre-wrap text-foreground/80 break-words"
                    >
                      {thought_block.thinking}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}

export default ThoughtBlock
