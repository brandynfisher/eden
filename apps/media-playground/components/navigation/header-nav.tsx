import DesktopHeaderNav from '@/components/navigation/desktop-header-nav'
import HeaderNavLinks from '@/components/navigation/header-nav-links'
import MobileHeaderNav from '@/components/navigation/mobile-header-nav'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { MenuIcon } from 'lucide-react'

const HeaderNav = () => {
  return (
    <>
      <DesktopHeaderNav>
        <HeaderNavLinks />
      </DesktopHeaderNav>
      <Sheet>
        <SheetTrigger asChild>
          <Button className="shrink-0 md:hidden" size="icon" variant="outline">
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <MobileHeaderNav>
            <HeaderNavLinks inSheet={true} />
          </MobileHeaderNav>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default HeaderNav
