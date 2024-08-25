import { PropsWithChildren } from 'react'

const MobileHeaderNav = ({ children }: PropsWithChildren) => {
  return (
    <nav className="relative z-10 grid gap-6 text-lg font-medium">
      {children}
    </nav>
  )
}

export default MobileHeaderNav
