'use client'

import FeedSearchForm from '@/components/filter/feed-search-form'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ModelsFeed from '@/features/feed/models-feed'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { BaseModelName, ModelV2 } from '@edenlabs/eden-sdk'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState<'user' | 'public'>('user')
  const [searchQuery, setSearchQuery] = useState('')

  const handleOnChange = (model: ModelV2) => {
    onChange(model._id)
    setOpen(false)
  }

  const scrollRef = useRef<HTMLDivElement>(null)
  const userModelsEmptyState = (
    <div className="flex flex-col items-center gap-3 text-center py-10">
      <p className="text-sm text-muted-foreground">
        You don't have any custom models yet.
      </p>
      <div className="flex gap-2 justify-center">
        <Button
          type="button"
          onClick={() => router.push('/studio/lora/flux_trainer')}
        >
          Train a model
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentTab('public')}
        >
          View public models
        </Button>
      </div>
    </div>
  )

  const onOpenChange = (open: boolean) => {
    setOpen(open)
    if (!open) {
      setSearchQuery('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            {base_model && (
              <Badge variant="secondary">
                {Array.isArray(base_model) ? base_model.join(', ') : base_model}
              </Badge>
            )}
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>
          <div className="flex flex-col sm:flex-row gap-4 w-full mb-4">
            <Tabs
              value={currentTab}
              onValueChange={value => setCurrentTab(value as 'user' | 'public')}
              className="w-full max-w-full"
            >
              <TabsList className="flex justify-stretch min-w-[328px] w-full md:w-auto md:min-w-[420px]">
                <TabsTrigger value="user" className="w-full">
                  My Models
                </TabsTrigger>
                <TabsTrigger value="public" className="w-full">
                  Public Models
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <FeedSearchForm handleSearch={setSearchQuery} />
          </div>

          {currentTab === 'user' ? (
            <ModelsFeed
              query={{ base_model, user: user?._id, search: searchQuery }}
              minCols={2}
              maxCols={5}
              onClick={handleOnChange}
              isSelectable={true}
              showFooterItems={{ name: true, actions: false }}
              scrollRef={scrollRef}
              selectedIds={selectedIds}
              emptyState={userModelsEmptyState}
            />
          ) : (
            <ModelsFeed
              query={{ base_model, search: searchQuery }}
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
