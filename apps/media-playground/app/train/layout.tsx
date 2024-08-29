import { PropsWithChildren } from 'react'

const PageLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="min-h-[calc(100vh_-_theme(spacing.16))] bg-background">
      <main className={'flex flex-1 flex-col gap-4 p-4 md:pt-0 !pb-0'}>
        {children}
      </main>
    </div>
  )
}

export default PageLayout
