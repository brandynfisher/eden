import { AssistantUiCustomProvider } from '@/providers/assistant-ui-custom-provider'
import { PropsWithChildren } from 'react'

const Layout = async ({ children }: PropsWithChildren) => {
  return <AssistantUiCustomProvider>{children}</AssistantUiCustomProvider>
}

export default Layout
