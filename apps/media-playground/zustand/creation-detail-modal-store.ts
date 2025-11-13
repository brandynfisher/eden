'use client'

import { useActiveFeedStore } from '@/zustand/feed-store'
import { CreationV2 } from '@edenlabs/eden-sdk'
import { create } from 'zustand'

type CreationDetailModalState = {
  isOpen: boolean
  creationId: string | null
  initialCreation: CreationV2 | null
  open: (params: {
    creationId: string
    initialCreation?: CreationV2 | null
  }) => void
  close: () => void
  reset: () => void
  setCreationId: (creationId: string) => void
  setInitialCreation: (creation: CreationV2 | null) => void
}

export const useCreationDetailModalStore = create<CreationDetailModalState>(
  set => ({
    isOpen: false,
    creationId: null,
    initialCreation: null,
    open: ({ creationId, initialCreation = null }) =>
      set({
        creationId,
        initialCreation: initialCreation ?? null,
        isOpen: true,
      }),
    close: () => {
      const { removeLastFromHistory } = useActiveFeedStore.getState()
      removeLastFromHistory()
      set({ isOpen: false })
    },
    reset: () => set({ creationId: null, initialCreation: null }),
    setCreationId: creationId => set({ creationId }),
    setInitialCreation: creation => set({ initialCreation: creation }),
  }),
)
