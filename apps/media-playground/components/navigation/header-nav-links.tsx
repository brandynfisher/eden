'use client'

import EdenLogoBwGlow from '@/components/logo/eden-logo-bw-glow'
import { NavLinkProps } from '@/components/navigation/nav-link'
import NavLinkList from '@/components/navigation/nav-link-list'
import { Separator } from '@/components/ui/separator'
import Link, { LinkProps } from 'next/link'
import { useSelectedLayoutSegments } from 'next/navigation'
import { PropsWithChildren } from 'react'

const HomeNavLink = ({ ...rest }: PropsWithChildren & LinkProps) => {
  return (
    <Link
      className="relative flex items-center gap-2 text-lg font-semibold md:text-base"
      {...rest}
    >
      <EdenLogoBwGlow />
      <span className="sr-only">Eden2.0</span>
    </Link>
  )
}

const navItemsExplore: NavLinkProps[] = [
  {
    label: 'Explore',
    segments: ['explore'],
  },
  // {
  //   label: 'Models',
  //   segments: ['models'],
  // },
  // {
  //   label: 'Artists',
  //   segments: ['artists'],
  // },
]

const navItemsMake: NavLinkProps[] = [
  {
    label: 'Create',
    segments: ['create'],
  },
  {
    label: 'Train',
    segments: ['train', 'lora_trainer'],
  },
]
type Props = {
  inSheet?: boolean
}

const HeaderNavLinks = ({ inSheet }: Props) => {
  const segments = useSelectedLayoutSegments()

  return (
    <>
      <HomeNavLink href="/" />
      <NavLinkList items={navItemsMake} segments={segments} inSheet={inSheet} />
      <div className="md:self-stretch md:flex md:items-center">
        <Separator
          orientation="vertical"
          className="hidden md:block max-h-7 "
        />
        <Separator orientation="horizontal" className="md:hidden max-h-7 " />
      </div>
      <NavLinkList
        items={navItemsExplore}
        segments={segments}
        inSheet={inSheet}
      />
    </>
  )
}

export default HeaderNavLinks
