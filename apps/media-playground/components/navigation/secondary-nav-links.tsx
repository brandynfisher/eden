'use client'

import { NavLinkProps } from '@/components/navigation/nav-link'
import NavLinkList from '@/components/navigation/nav-link-list'
import { useSelectedLayoutSegments } from 'next/navigation'

export type SecondaryNavSection = {
  title: string
  links: NavLinkProps[]
}

export type SecondaryNavProps = {
  baseSegment: string
  items: SecondaryNavSection[]
}

const SecondaryNavLinks = ({ items, baseSegment }: SecondaryNavProps) => {
  const partialSegments = useSelectedLayoutSegments()
  const segments = baseSegment
    ? [baseSegment, ...partialSegments]
    : partialSegments

  return (
    <div className="flex flex-col gap-6">
      {items.map(item => (
        <div key={item.title} className="flex flex-col gap-1">
          <div className="font-bold mb-2">{item.title}</div>
          <NavLinkList items={item.links} segments={segments} />
        </div>
      ))}
    </div>
  )
}

export default SecondaryNavLinks
