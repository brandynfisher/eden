// Header for /explore and /create pages - similar to chat header design
import HeaderActions from '@/components/header/header-actions'
import HeaderLogo from '@/components/header/header-logo'
import HeaderNavLinks from '@/components/header/header-nav-links'

const ExploreHeader = () => {
  return (
    <>
      {/* Mobile: Single navbar */}
      <header className="md:hidden sticky z-50 top-0 flex h-16 items-center gap-4 border-b bg-background px-2">
        {/* Left section - Eden logo and navigation */}
        <div className="flex items-center gap-6">
          <HeaderLogo />
          <HeaderNavLinks />
        </div>

        {/* Right section - Profile, manna, notifications */}
        <HeaderActions hideMannaMobile />
      </header>

      {/* Desktop: Single navbar (simpler than chat since no agent selector needed) */}
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

export default ExploreHeader
