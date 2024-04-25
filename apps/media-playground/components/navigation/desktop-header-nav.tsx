import { PropsWithChildren } from 'react'

const DesktopHeaderNav = ({children}: PropsWithChildren) => {
  return (
    <nav
      className='hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6'>
      {children}
    </nav>
  )
}

export default DesktopHeaderNav