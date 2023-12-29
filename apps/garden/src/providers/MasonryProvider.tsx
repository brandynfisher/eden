import { Character, Concept, Creation, Creator } from '@edenlabs/eden-sdk'
import React, { PropsWithChildren, createContext, useState } from 'react'

export interface MasonryContextType {
  currentIndex: number
  setCurrentIndex: (newIndex: number) => void
  items: Creation[] | Concept[] | Creator[] | Character[]
  setItems: (items: Creation[] | Concept[] | Creator[] | Character[]) => void
}

const defaultMasonryContextState: MasonryContextType = {
  currentIndex: 0,
  setCurrentIndex: () => null,
  items: [],
  setItems: () => null,
}

export const MasonryContext = createContext<MasonryContextType>(
  defaultMasonryContextState,
)

function MasonryProvider({ children }: PropsWithChildren) {
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [items, setItems] = useState<
    Creation[] | Concept[] | Creator[] | Character[]
  >([])

  return (
    <MasonryContext.Provider
      value={{
        currentIndex,
        setCurrentIndex,
        items,
        setItems,
      }}
    >
      {children}
    </MasonryContext.Provider>
  )
}

export default MasonryProvider
