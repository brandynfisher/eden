import { EdenRuntimeProvider } from '@/features/chat/providers/eden-runtime-provider'
import { PropsWithChildren } from 'react'

const Layout = async ({ children }: PropsWithChildren) => {
  return <EdenRuntimeProvider>{children}</EdenRuntimeProvider>
}

export default Layout
