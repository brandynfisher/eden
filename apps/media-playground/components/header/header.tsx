import { ThemeToggle } from '@/components/theme-toggle'
import HeaderNav from '@/components/navigation/header-nav'

const Header = () => {
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <HeaderNav />
      <ThemeToggle />
    </header>
  )
}

export default Header
