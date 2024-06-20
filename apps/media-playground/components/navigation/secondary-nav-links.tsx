'use client'

import NavLink, { NavLinkProps } from '@/components/navigation/nav-link'
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
          {item.links.map(item => (
            <NavLink
              key={item.label}
              label={item.label}
              segments={item.segments}
              active={
                (segments &&
                  segments.length === 0 &&
                  item.segments.length === 0) ||
                (segments && segments.length && item.segments[0] !== undefined)
                  ? item.segments.every((v, i) => v === segments[i])
                  : false
              }
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default SecondaryNavLinks
