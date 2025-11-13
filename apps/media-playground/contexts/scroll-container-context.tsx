'use client'

import { PropsWithChildren, RefObject, createContext, useContext } from 'react'

type ScrollContainerContextValue = RefObject<HTMLDivElement> | null

const ScrollContainerContext = createContext<ScrollContainerContextValue>(null)

export const ScrollContainerProvider = ({
  value,
  children,
}: PropsWithChildren<{ value: RefObject<HTMLDivElement> }>) => {
  return (
    <ScrollContainerContext.Provider value={value}>
      {children}
    </ScrollContainerContext.Provider>
  )
}

export const useScrollContainer = () => useContext(ScrollContainerContext)
