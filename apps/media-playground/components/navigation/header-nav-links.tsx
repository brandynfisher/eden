'use client'

import Link, { LinkProps } from 'next/link'
import EdenLogoBwGlow from '@/components/logo/eden-logo-bw-glow'
import { PropsWithChildren } from 'react'
import { useSelectedLayoutSegments } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import NavLink, { NavLinkProps } from '@/components/navigation/nav-link'

const HomeNavLink = ({ ...rest }: PropsWithChildren & LinkProps) => {
  return (
    <Link className='relative flex items-center gap-2 text-lg font-semibold md:text-base' {...rest} >
      <EdenLogoBwGlow />
      <span className='sr-only'>Eden2.0</span>
    </Link>
  )
}

const navItemsExplore: NavLinkProps[] = [
  {
    label: 'Featured',
    segments: [],
  },
  {
    label: 'Models',
    segments: ['models'],
  },
  {
    label: 'Artists',
    segments: ['artists'],
  },
]

const navItemsMake: NavLinkProps[] = [
  {
    label: 'Create',
    segments: ['create'],
  },
  {
    label: 'Train',
    segments: ['train'],
  },
  {
    label: 'Build',
    segments: ['build'],
  },
]

const HeaderNavLinks = () => {
  const segments = useSelectedLayoutSegments()

  return (
    <>
      <HomeNavLink href='/' />
      {navItemsExplore.map(item => (
        <NavLink
          key={item.label}
          label={item.label}
          segments={item.segments}
          active={(segments && segments.length === 0 && item.segments.length === 0) || segments && segments.length && item.segments[0] !== undefined ? item.segments.every((v, i) => v === segments[i]) : false}
        />
      ))}
      <div className='md:self-stretch md:flex md:items-center'>
        <Separator orientation='vertical' className='hidden md:block max-h-7 ' />
        <Separator orientation='horizontal' className='md:hidden max-h-7 ' />
      </div>
      {navItemsMake.map(item => (
        <NavLink
          key={item.label}
          label={item.label}
          segments={item.segments}
          active={(segments && segments.length === 0 && item.segments.length === 0) || segments && segments.length && item.segments[0] !== undefined ? item.segments.every((v, i) => v === segments[i]) : false}
        />
      ))}
    </>
  )
}

export default HeaderNavLinks