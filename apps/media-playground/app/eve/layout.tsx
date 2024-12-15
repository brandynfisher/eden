import { PropsWithChildren } from 'react'

const Layout = async ({ children }: PropsWithChildren) => {
  // return <EdenRuntimeProvider>{children}</EdenRuntimeProvider>
  return <div>{children}</div>
}

export default Layout
