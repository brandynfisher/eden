import { useEdenState } from '@/hooks/useEdenState'
import { Generator } from '@eden-labs/eden-sdk/dist/responses/GeneratorsGetResponse'
import React, { PropsWithChildren, createContext } from 'react'

export interface EdenContextType {
  generators?: Generator[]
}

export const EdenContext = createContext<EdenContextType>({
  generators: undefined,
})

function EdenProvider({ children }: PropsWithChildren) {
  const edenState = useEdenState()

  return (
    <EdenContext.Provider value={edenState}>{children}</EdenContext.Provider>
  )
}

export default EdenProvider
