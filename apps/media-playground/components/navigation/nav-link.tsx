import { SheetClose } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export type NavLinkProps = {
  label: string
  segments: string[]
  active?: boolean
  inSheet?: boolean
  description?: string
  mediaUrl?: string
  href?: string // Custom href override
  badge?: string // Optional badge text (e.g., "BETA")
}

const NavLink = ({
  label,
  segments,
  active,
  inSheet,
  href: customHref,
  badge,
}: NavLinkProps) => {
  const href = customHref || `/${segments.join('/')}`

  const content = badge ? (
    <span className="flex items-center gap-1.5">
      {label}
      <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
        {badge}
      </span>
    </span>
  ) : (
    label
  )

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
          {content}
        </Link>
      </SheetClose>
    )
  }

  return (
    <Link
      prefetch={false}
      className={cn(
        'text-muted-foreground transition-colors hover:text-foreground capitalize py-2 px-3 hover:bg-accent rounded-md',
        active ? 'text-foreground bg-accent/50' : '',
      )}
      href={href}
    >
      {content}
    </Link>
  )
}

export default NavLink
