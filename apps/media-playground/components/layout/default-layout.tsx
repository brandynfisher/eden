import { PropsWithChildren } from 'react'

const DefaultLayout = ({ children }: PropsWithChildren) => {
  return (
    <main className="flex min-h-[calc(100dvh_-_theme(spacing.16))] flex-1 flex-col bg-background gap-4 p-2 md:p-4 md:gap-8 lg:p-10">
      {children}
    </main>
  )
}

export default DefaultLayout
