import EdenLogoBwGlow from '@/components/logo/eden-logo-bw-glow'
import DesktopHeaderNav from '@/components/navigation/desktop-header-nav'
import HeaderNavLinks from '@/components/navigation/header-nav-links'
import MobileHeaderNav from '@/components/navigation/mobile-header-nav'
import { Button } from '@/components/ui/button'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { MenuIcon } from 'lucide-react'

const HeaderNav = () => {
  return (
    <>
      <DesktopHeaderNav>
        <HeaderNavLinks />
      </DesktopHeaderNav>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            className="shrink-0 md:hidden justify-around w-16"
            size="icon"
            variant="outline"
          >
            <EdenLogoBwGlow className="w-[24px]" />
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <VisuallyHidden>
            <DialogHeader>
              <DialogTitle>Main Navigation</DialogTitle>
            </DialogHeader>
          </VisuallyHidden>
          <MobileHeaderNav>
            <HeaderNavLinks inSheet={true} />
          </MobileHeaderNav>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default HeaderNav
