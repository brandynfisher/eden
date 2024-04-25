'use client'

import Link, { LinkProps } from 'next/link'
import EdenLogoBwGlow from '@/components/logo/eden-logo-bw-glow'
import { PropsWithChildren } from 'react'
import { useSelectedLayoutSegments } from 'next/navigation'
import { cn } from '@/lib/utils'

const HomeNavLink = ({ ...rest }: PropsWithChildren & LinkProps) => {
  return (
    <Link className='relative flex items-center gap-2 text-lg font-semibold md:text-base' {...rest} >
      <EdenLogoBwGlow />
      <span className='sr-only'>Eden2.0</span>
    </Link>
  )
}

type Props = {
  label: string
  segments: string[]
  active?: boolean
}

const NavLink = ({ label, segments, active }: Props) => {
  const href = `/${segments.join('/')}`
  return (
    <Link
      className={cn(
        'text-muted-foreground transition-colors hover:text-foreground capitalize',
        active ? 'text-foreground' : ''
      )}
      href={href}
    >
      {label}
    </Link>
  )
}

const navItems = [
  {
    label: 'Featured',
    segments: []
  },
  {
    label: 'Models',
    segments: ['models']
  },
  {
    label: 'Create',
    segments: ['create']
  },
  {
    label: 'Train',
    segments: ['train']
  }
]

const HeaderNavLinks = () => {
  const segments = useSelectedLayoutSegments()

  return (
    <>
      <HomeNavLink href='/' />
      { navItems.map(item => (
        <NavLink
          key={item.label}
          label={item.label}
          segments={item.segments}
          active={(segments && segments.length === 0 && item.segments.length === 0) || segments && segments.length ? item.segments.every((v,i) => v === segments[i]) : false}
        />
      )) }
    </>
  )
}

export default HeaderNavLinks