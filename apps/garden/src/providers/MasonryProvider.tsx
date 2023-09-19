import { Concept, Creation } from '@edenlabs/eden-sdk'
import React, { PropsWithChildren, createContext, useState } from 'react'

export interface MasonryContextType {
  currentIndex: number | null
  setCurrentIndex: (newIndex: number | null) => void
  totalItems: number
  setTotalItems: (newItems: number) => void
  currentItem: Creation | Concept | null
  setCurrentItem: (newItem: Creation | Concept) => void
  items: Creation[] | Concept[]
  setItems: (items: Creation[] | Concept[]) => void
}

const defaultMasonryContextState: MasonryContextType = {
  currentIndex: 0,
  setCurrentIndex: () => null,
  totalItems: 0,
  setTotalItems: () => null,
  currentItem: null,
  setCurrentItem: () => null,
  items: [],
  setItems: () => null,
}

export const MasonryContext = createContext<MasonryContextType>(
  defaultMasonryContextState,
)

function MasonryProvider({ children }: PropsWithChildren) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [currentItem, setCurrentItem] = useState<Creation | Concept | null>(
    null,
  )
  const [totalItems, setTotalItems] = useState(0)
  const [items, setItems] = useState<Creation[] | Concept[]>([])

  return (
    <MasonryContext.Provider
      value={{
        currentIndex,
        setCurrentIndex,
        currentItem,
        setCurrentItem,
        totalItems,
        setTotalItems,
        items,
        setItems,
      }}
    >
      {children}
    </MasonryContext.Provider>
  )
}

export default MasonryProvider
