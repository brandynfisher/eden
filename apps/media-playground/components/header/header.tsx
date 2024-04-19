import EdenLogoBwGlow from '@/components/logo/eden-logo-bw-glow'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'

const Header = () => {
  return (
    <header className="flex gap-2 w-full justify-between items-center">
      <Link href={'/'} className="flex gap-2 flex-shrink-0 items-center">
        <EdenLogoBwGlow width={36} height={36} />
        <h2 className="flex-shrink-0 font-semibold text-2xl">Eden v2</h2>
      </Link>
      <ThemeToggle />
    </header>
  )
}

export default Header
