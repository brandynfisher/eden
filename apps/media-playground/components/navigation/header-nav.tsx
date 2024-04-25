
import { MenuIcon } from 'lucide-react'
import { Sheet, SheetContent } from '../ui/sheet'
import { SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import DesktopHeaderNav from '@/components/navigation/desktop-header-nav'
import MobileHeaderNav from '@/components/navigation/mobile-header-nav'

const HeaderNav = () => {
  return (
    <>
      <DesktopHeaderNav />
      <Sheet>
        <SheetTrigger asChild>
          <Button className="shrink-0 md:hidden" size="icon" variant="outline">
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <MobileHeaderNav />
        </SheetContent>
      </Sheet>
    </>
  )
}

export default HeaderNav