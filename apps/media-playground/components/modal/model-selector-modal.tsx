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
import { PropsWithChildren, ReactNode, useMemo, useRef, useState } from 'react'

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

  const dialogContentRef = useRef<HTMLDivElement>(null)
  const feedScrollRef = useRef<HTMLDivElement>(null)
  const effectiveDescription = useMemo(() => {
    if (description) return description
    return 'Pick a model to use as a LoRA or browse public ones.'
  }, [description])
  const userModelsEmptyState = (
    <div className="flex flex-col items-center justify-center gap-3 text-center py-16 min-h-[360px]">
      <div className="grid place-items-center size-11 rounded-full bg-muted/30 border border-border/40 text-muted-foreground">
        <span className="text-base">∅</span>
      </div>
      <div className="space-y-1 max-w-sm">
        <p className="text-base font-semibold">No models found</p>
        <p className="text-sm text-muted-foreground">
          Start by training a custom model or browse the public library.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
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
          Browse public models
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
        ref={dialogContentRef}
        className={cn(
          'overflow-hidden flex flex-col w-[min(880px,88vw)] max-h-[80vh] min-h-[420px] p-5 md:p-7 gap-5 rounded-2xl border border-border/60 bg-background/95 backdrop-blur shadow-2xl',
          className,
        )}
      >
        <DialogHeader className="mt-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl md:text-2xl">{title}</DialogTitle>
              {base_model && (
                <Badge variant="secondary">
                  {Array.isArray(base_model)
                    ? base_model.join(', ')
                    : base_model}
                </Badge>
              )}
            </div>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {effectiveDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between rounded-xl border border-border/60 bg-muted/10 px-3 py-3">
              <Tabs
                value={currentTab}
                onValueChange={value =>
                  setCurrentTab(value as 'user' | 'public')
                }
                className="w-full md:w-auto"
              >
                <TabsList className="grid grid-cols-2 w-full md:w-auto md:min-w-[280px]">
                  <TabsTrigger value="user">My Models</TabsTrigger>
                  <TabsTrigger value="public">Public Models</TabsTrigger>
                </TabsList>
              </Tabs>

              <FeedSearchForm
                handleSearch={setSearchQuery}
                className="md:ml-auto w-full md:w-[300px]"
              />
            </div>
          </div>

          <div
            ref={feedScrollRef}
            className="flex-1 overflow-y-auto rounded-xl border border-border/60 bg-muted/10 px-2 md:px-3 pb-3 min-h-[420px]"
          >
            {currentTab === 'user' ? (
              <ModelsFeed
                query={{ base_model, user: user?._id, search: searchQuery }}
                minCols={2}
                maxCols={4}
                onClick={handleOnChange}
                isSelectable={true}
                showFooterItems={{ name: true, actions: false }}
                scrollRef={feedScrollRef}
                selectedIds={selectedIds}
                emptyState={userModelsEmptyState}
              />
            ) : (
              <ModelsFeed
                query={{ base_model, search: searchQuery }}
                minCols={2}
                maxCols={4}
                onClick={handleOnChange}
                isSelectable={true}
                showFooterItems={{ name: true, actions: false }}
                scrollRef={feedScrollRef}
                selectedIds={selectedIds}
              />
            )}
          </div>
        </div>
      </DialogContentScrollable>
    </Dialog>
  )
}

export default ModelSelectorModal
