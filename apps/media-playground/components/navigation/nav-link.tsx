import { SheetClose } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export type NavLinkProps = {
  label: string
  segments: string[]
  active?: boolean
  inSheet?: boolean
}

const NavLink = ({ label, segments, active, inSheet }: NavLinkProps) => {
  const href = `/${segments.join('/')}`

  if (inSheet) {
    return (
      <SheetClose asChild>
        <Link
          prefetch={false}
          className={cn(
            'text-muted-foreground transition-colors hover:text-foreground capitalize',
            active ? 'text-foreground' : '',
          )}
          href={href}
        >
          {label}
        </Link>
      </SheetClose>
    )
  }

  return (
    <Link
      prefetch={false}
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
