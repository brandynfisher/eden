import { Character, Concept, Creation, Creator } from '@edenlabs/eden-sdk'
import React, { PropsWithChildren, createContext, useState } from 'react'

export type MasonryItems = {
  items: Creation[] | Concept[] | Creator[] | Character[]
  currentIndex: number
}

export type MasonryInstances = { [masonryKey: string]: MasonryItems }

export interface MasonryContextType {
  getCurrentIndex: (masonryKey: string) => number
  setCurrentIndex: (masonryKey: string, newIndex: number) => void
  setItems: (
    masonryKey: string,
    items: Creation[] | Concept[] | Creator[] | Character[],
  ) => void
  getItems: (
    masonryKey: string,
  ) => Creation[] | Concept[] | Creator[] | Character[]
  instances: MasonryInstances
}

const defaultMasonryContextState: MasonryContextType = {
  getCurrentIndex: () => 0,
  setCurrentIndex: () => null,
  getItems: () => [],
  setItems: () => [],
  instances: {},
}

export const MasonryContext = createContext<MasonryContextType>(
  defaultMasonryContextState,
)

function MasonryProvider({ children }: PropsWithChildren) {
  const [instances, setInstances] = useState<MasonryInstances>({})

  // console.log('MasonryProvider instances', instances)

  const getCurrentIndex = (masonryKey: string) => {
    // console.log('getCurrentIndex', masonryKey, instances[masonryKey].currentIndex)
    return instances[masonryKey] ? instances[masonryKey].currentIndex : 0
  }

  const setCurrentIndex = (masonryKey: string, currentIndex: number) => {
    // console.log('setCurrentIndex', masonryKey, currentIndex)
    setInstances(prev => {
      const inst = { ...prev }
      inst[masonryKey] = { ...inst[masonryKey], currentIndex: currentIndex }
      return inst
    })
  }

  const setItems = (
    masonryKey: string,
    items: Creation[] | Concept[] | Creator[] | Character[],
  ) => {
    // console.log('setItems', masonryKey, items)
    setInstances(prev => {
      const inst = { ...prev }
      inst[masonryKey] = { ...inst[masonryKey], items: items }
      return inst
    })
  }

  const getItems = (masonryKey: string) => {
    // console.log('getItems', masonryKey, instances[masonryKey].items)
    return instances[masonryKey].items
  }

  return (
    <MasonryContext.Provider
      value={{
        setItems,
        getItems,
        getCurrentIndex,
        setCurrentIndex,
        instances,
      }}
    >
      {children}
    </MasonryContext.Provider>
  )
}

export default MasonryProvider
