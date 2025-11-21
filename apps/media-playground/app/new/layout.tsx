import { ReactNode } from 'react'

export default function NewLayout({ children }: { children: ReactNode }) {
  return <div className="h-screen w-screen overflow-auto">{children}</div>
}
