import Link from 'next/link'
import EdenLogoBwGlow from '@/components/logo/eden-logo-bw-glow'

const HeaderNavLinks = () => {
  return (
    <>
      <Link className="relative flex items-center gap-2 text-lg font-semibold md:text-base" href="/">
        <EdenLogoBwGlow />
        <span className="sr-only">Eden2.0</span>
      </Link>
      <Link className="text-muted-foreground transition-colors hover:text-foreground" href="#">
        Dashboard
      </Link>
      <Link className="text-muted-foreground transition-colors hover:text-foreground" href="#">
        Orders
      </Link>
      <Link className="text-muted-foreground transition-colors hover:text-foreground" href="#">
        Products
      </Link>
      <Link className="text-muted-foreground transition-colors hover:text-foreground" href="#">
        Customers
      </Link>
      <Link className="text-foreground transition-colors hover:text-foreground" href="#">
        Settings
      </Link>
    </>
  )
}

export default HeaderNavLinks