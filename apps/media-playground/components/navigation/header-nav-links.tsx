'use client'

import EdenLogoBw from '@/components/logo/eden-logo-bw'
import NavLinkList from '@/components/navigation/nav-link-list'
import { Separator } from '@/components/ui/separator'
import { SheetClose } from '@/components/ui/sheet'
import Link, { LinkProps } from 'next/link'
import { useSelectedLayoutSegments } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { PropsWithChildren } from 'react'

const HomeNavLink = ({
  inSheet,
  ...rest
}: PropsWithChildren & LinkProps & { inSheet?: boolean }) => {
  return inSheet ? (
    <SheetClose asChild>
      <Link
        className="relative flex items-center gap-2 text-lg font-semibold md:text-base mr-2"
        {...rest}
      >
        <EdenLogoBw />
        <span className="sr-only">Eden2.0</span>
      </Link>
    </SheetClose>
  ) : (
    <Link
      className="relative flex items-center gap-2 text-lg font-semibold md:text-base mr-2"
      {...rest}
    >
      <EdenLogoBw />
      <span className="sr-only">Eden2.0</span>
    </Link>
  )
}

type Props = {
  inSheet?: boolean
}

const HeaderNavLinks = ({ inSheet }: Props) => {
  const segments = useSelectedLayoutSegments() || []
  const searchParams = useSearchParams()
  const contentType = searchParams?.get('type')

  return (
    <>
      <HomeNavLink href="/chat/eve" inSheet={inSheet} />
      <NavLinkList
        items={[
          {
            label: 'Creations',
            segments: [`explore`],
            href: '/explore?type=creations',
            active:
              segments?.[0] === 'explore' &&
              (contentType === 'creations' || !contentType),
          },
        ]}
        segments={segments}
        inSheet={inSheet}
      />
      <div className="md:self-stretch md:flex md:items-center">
        <Separator orientation="vertical" className="hidden md:block" />
        <Separator orientation="horizontal" className="md:hidden" />
      </div>
      <NavLinkList
        items={[
          {
            label: 'Models',
            segments: [`explore`],
            href: '/explore?type=models',
            active: segments[0] === 'explore' && contentType === 'models',
          },
        ]}
        segments={segments}
        inSheet={inSheet}
      />
      <div className="md:self-stretch md:flex md:items-center">
        <Separator orientation="vertical" className="hidden md:block" />
        <Separator orientation="horizontal" className="md:hidden" />
      </div>
      <NavLinkList
        items={[
          {
            label: 'Agents',
            segments: [`explore`],
            href: '/explore?type=agents',
            active: segments[0] === 'explore' && contentType === 'agents',
          },
        ]}
        segments={segments}
        inSheet={inSheet}
      />
      <div className="md:self-stretch md:flex md:items-center">
        <Separator orientation="vertical" className="hidden md:block" />
        <Separator orientation="horizontal" className="md:hidden" />
      </div>
      <NavLinkList
        items={[
          {
            label: 'Tools',
            segments: [`explore`],
            href: '/explore?type=tools',
            active: segments[0] === 'explore' && contentType === 'tools',
          },
        ]}
        segments={segments}
        inSheet={inSheet}
      />
    </>
  )
}

export default HeaderNavLinks
