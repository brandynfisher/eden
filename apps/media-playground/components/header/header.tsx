// Header for home page (/) - matches design from other pages
import HeaderActions from '@/components/header/header-actions'
import HeaderLogo from '@/components/header/header-logo'
import HeaderNavLinks from '@/components/header/header-nav-links'

const Header = () => {
  return (
    <>
      {/* Mobile: Single navbar */}
      <header className="md:hidden sticky z-40 top-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-3">
          {/* Left section - Eden logo and navigation */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <HeaderLogo className="flex-shrink-0" size="w-[28px]" />
            <HeaderNavLinks />
          </div>

          {/* Right section - Profile, manna, notifications */}
          <HeaderActions
            hideMannaMobile
            className="ml-auto flex items-center gap-2 h-10 flex-shrink-0 pl-1"
          />
        </div>
      </header>

      {/* Desktop: Single navbar with breathing room */}
      <header className="hidden md:block sticky z-40 top-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-5">
          {/* Left section - Logo and navigation */}
          <div className="flex min-w-0 items-center gap-5">
            <HeaderLogo />
            <HeaderNavLinks />
          </div>

          {/* Right section - Profile, manna, notifications */}
          <HeaderActions className="ml-auto flex items-center gap-3 h-12 pl-3" />
        </div>
      </header>
    </>
  )
}

export default Header
