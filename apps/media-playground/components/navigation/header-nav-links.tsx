'use client'

import EdenLogoBw from '@/components/logo/eden-logo-bw'
import NavLinkList from '@/components/navigation/nav-link-list'
import { Separator } from '@/components/ui/separator'
import { SheetClose } from '@/components/ui/sheet'
import Link, { LinkProps } from 'next/link'
import { useSelectedLayoutSegments } from 'next/navigation'
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
  const segments = useSelectedLayoutSegments()

  return (
    <>
      <HomeNavLink href="/" inSheet={inSheet} />
      <NavLinkList
        items={[
          {
            label: 'Agents',
            segments: [`agents`],
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
            segments: [`models`],
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
            label: 'Creations',
            segments: [`creations`],
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
            // segments: [`create`, `image`, `flux_schnell`],
            segments: [`create`],
          },
        ]}
        segments={segments}
        inSheet={inSheet}
      />
    </>
  )
}

export default HeaderNavLinks
