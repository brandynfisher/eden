import Link from 'next/link'
import { cn } from '@/lib/utils'

export type NavLinkProps = {
  label: string
  segments: string[]
  active?: boolean
}

const NavLink = ({ label, segments, active }: NavLinkProps) => {
  const href = `/${segments.join('/')}`
  return (
    <Link
      className={cn(
        'text-muted-foreground transition-colors hover:text-foreground capitalize',
        active ? 'text-foreground' : '',
      )}
      href={href}
    >
      {label}
    </Link>
  )
}

export default NavLink