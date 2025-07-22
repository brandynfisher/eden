// Header for home page (/) - matches design from other pages
import HeaderActions from '@/components/header/header-actions'
import HeaderLogo from '@/components/header/header-logo'
import HeaderNavLinks from '@/components/header/header-nav-links'

const Header = () => {
  return (
    <>
      {/* Mobile: Single navbar */}
      <header className="md:hidden sticky z-50 top-0 flex h-16 items-center gap-2 sm:gap-4 border-b bg-background px-1 sm:px-2">
        {/* Left section - Eden logo and navigation */}
        <div className="flex items-center gap-2 sm:gap-6 min-w-0 flex-1">
          <HeaderLogo />
          <HeaderNavLinks />
        </div>

        {/* Right section - Profile, manna, notifications */}
        <HeaderActions
          hideMannaMobile
          className="ml-auto flex items-center gap-1 sm:gap-2 h-10 flex-shrink-0"
        />
      </header>

      {/* Desktop: Single navbar */}

      <header className="hidden md:flex sticky z-50 top-0 h-14 items-center gap-4 border-b bg-background px-4">
        {/* Left section - Logo and navigation */}
        <div className="flex items-center gap-6">
          <HeaderLogo />
          <HeaderNavLinks />
        </div>

        {/* Right section - Profile, manna, notifications */}
        <HeaderActions />
      </header>
    </>
  )
}

export default Header
