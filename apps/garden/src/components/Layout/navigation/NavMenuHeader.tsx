import HeaderLogo from '@/components/Layout/HeaderLogo'
import NavBurgerButton from '@/components/Layout/navigation/NavBurgerButton'
import React from 'react'

const NavMenuHeader = ({
  onClose,
  isVisible,
}: {
  onClose: () => void
  isVisible: boolean
}) => {
  return (
    <div
      className="flex justify-between items-center py-4 pl-4 pr-1 h-[64px]"
      style={{ borderInlineEnd: '1px solid rgba(5, 5, 5, 0.06)' }}
    >
      <HeaderLogo />
      <div
        className={`block lg:hidden transition-opacity delay-75 duration-75 ${
          !isVisible ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={onClose}
      >
        <NavBurgerButton open={isVisible} />
      </div>
    </div>
  )
}

export default NavMenuHeader
