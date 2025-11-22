import { ReactNode } from 'react'

export default function NewLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen w-full overflow-auto">{children}</div>
}
