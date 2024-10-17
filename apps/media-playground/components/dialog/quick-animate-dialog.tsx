'use client'

import QuickAnimateForm from '@/components/dialog/quick-animate-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { useQuickAnimateModal } from '@/stores/dialogs/dialogs.selector'
import {  updateQuickAnimateModal } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import React, { Suspense, useCallback } from 'react'


const FormSkeleton = () => {
  return (
    <div className="p-4 min-h-[204px] flex flex-col">
      <Skeleton className="h-4 w-full mb-4" />
      <Skeleton className="h-[84px] w-full mb-4" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

const QuickAnimateDialog = () => {
  const dispatch = useAppDispatch()
  const quickAnimateModal = useQuickAnimateModal()
  const handleQuickAnimateModalOpenChange = useCallback(() => {
    dispatch(updateQuickAnimateModal({ isOpen: !quickAnimateModal.isOpen }))
  }, [dispatch, quickAnimateModal.isOpen])

  if (!quickAnimateModal.creation) {
    return null
  }

  const tabs = [
    {
      key: 'animate_3D',
      title: 'Animate 3D',
      content: (
        <Suspense fallback={<FormSkeleton />}>
          <QuickAnimateForm
            toolKey={'animate_3D'}
            exposedParameters={['n_frames']}
            initValues={{ image: getCloudfrontOriginalUrl(quickAnimateModal.creation.url) || '' }}
          />
        </Suspense>
      ),
    },
    {
      key: 'img2vid',
      title: 'Animate',
      content: (
        <Suspense fallback={<FormSkeleton />}>
          <QuickAnimateForm
            toolKey={'img2vid'}
            exposedParameters={['num_frames']}
            initValues={{ image: getCloudfrontOriginalUrl(quickAnimateModal.creation.url) || '' }}
          />
        </Suspense>
      ),
    },
  ]

  return (
    <>
      <Dialog
        open={quickAnimateModal.isOpen}
        onOpenChange={handleQuickAnimateModalOpenChange}
      >
        <DialogContent className="max-w-[calc(100vw-32px)] sm:max-w-lg">
          <DialogTitle>Quick Animate</DialogTitle>
          <DialogDescription>Animate an image with...</DialogDescription>
          <Tabs defaultValue={tabs[0].key} className="w-full max-w-full">
            <TabsList className="flex justify-stretch rounded-b-none">
              {tabs.map(tab => (
                <TabsTrigger key={tab.key} value={tab.key} className="w-full">
                  {tab.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map(tab => (
              <TabsContent
                key={tab.key}
                value={tab.key}
                className="mt-0 min-h-[204px] border border-secondary border-t-0 rounded-md rounded-t-none"
              >
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default QuickAnimateDialog
