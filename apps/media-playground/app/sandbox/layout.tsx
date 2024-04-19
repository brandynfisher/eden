import Header from '@/components/header/header'
import { ReactNode } from 'react'

export default function SandboxLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-col items-center">
      <div className="flex w-full flex-col justify-between items-center gap-4 max-w-7xl min-h-screen p-4 md:p-8">
        <Header />
        {children}
      </div>
    </main>
  )
}
