'use client'

import ToggleButton from '@/components/button/toggle-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogContentScrollable } from '@/components/ui/custom/dialog-content-scrollable'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ToggleGroup } from '@/components/ui/toggle-group'
import ModelsFeed from '@/features/feed/models-feed'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { BaseModelName, ModelV2 } from '@edenlabs/eden-sdk'
import { PropsWithChildren, ReactNode, useRef, useState } from 'react'

type Props = {
  title?: ReactNode
  description?: ReactNode
  className?: string
  trigger?: ReactNode
  currentValue: string
  base_model?: BaseModelName | BaseModelName[]
  onChange: (id: string) => void
  selectedIds?: string[]
} & PropsWithChildren

const ModelSelectorModal = ({
  title,
  description,
  className,
  trigger,
  base_model,
  onChange,
  selectedIds = [],
}: Props) => {
  const { user } = useAuthState()

  const [open, setOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState<'user' | 'public'>('user')

  const handleOnChange = (model: ModelV2) => {
    onChange(model._id)
    setOpen(false)
  }

  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline" className="mt-2">
            Select model
          </Button>
        )}
      </DialogTrigger>
      <DialogContentScrollable
        ref={scrollRef}
        className={cn([`overflow-x-hidden flex flex-col max-w-7xl`, className])}
      >
        <DialogHeader className="mt-4">
          <div className="flex gap-4 items-center">
            <DialogTitle className="py-2">{title}</DialogTitle>
            <Badge variant="secondary">
              {Array.isArray(base_model) ? base_model.join(', ') : base_model}
            </Badge>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>
          <div className="flex flex-col items-center sm:block">
            <ToggleGroup
              type="single"
              value={currentTab}
              className="border border-muted rounded-lg p-1 mb-4 flex items-center max-w-fit bg-popover"
            >
              <ToggleButton
                className="w-32"
                value={'user'}
                label={'My Models'}
                onClick={() => setCurrentTab('user')}
              />
              <ToggleButton
                className="w-32"
                value={'public'}
                label={'Public Models'}
                onClick={() => setCurrentTab('public')}
              />
            </ToggleGroup>
          </div>

          {currentTab === 'user' ? (
            <ModelsFeed
              query={{ base_model, user: user?._id }}
              minCols={2}
              maxCols={5}
              onClick={handleOnChange}
              isSelectable={true}
              showFooterItems={{ name: true, actions: false }}
              scrollRef={scrollRef}
              selectedIds={selectedIds}
            />
          ) : (
            <ModelsFeed
              query={{ base_model }}
              minCols={2}
              maxCols={5}
              onClick={handleOnChange}
              isSelectable={true}
              showFooterItems={{ name: true, actions: false }}
              scrollRef={scrollRef}
              selectedIds={selectedIds}
            />
          )}
        </div>
      </DialogContentScrollable>
    </Dialog>
  )
}

export default ModelSelectorModal
