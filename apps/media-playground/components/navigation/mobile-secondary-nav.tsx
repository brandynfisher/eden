'use client'

import { ToolCardMedia } from '@/components/card/tool-card'
import LoadingIndicator from '@/components/loading-indicator'
import { SecondaryNavSection } from '@/components/navigation/secondary-nav-links'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { Skeleton } from '@/components/ui/skeleton'
import TypographyH6 from '@/components/ui/typography/TypographyH6'
import { getMediaUrl } from '@/features/tools/tools-grid-section'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { Suspense } from 'react'

// import { useSelectedLayoutSegments } from 'next/navigation'

type Props = {
  title?: string
  baseSegment: string
  items: SecondaryNavSection[]
}

const MobileSecondaryNav = ({ title, baseSegment, items }: Props) => {
  return (
    <div className="relative flex px-1 items-center bg-muted-darker z-20 md:sticky md:top-16 drop-shadow-lg">
      <NavigationMenu>
        {title ? (
          <Link href={`/${baseSegment}`} className="py-3 px-2 mr-1 sm:mr-2">
            <TypographyH6 className="text-accent-foreground text-xs md:text-sm">
              {title}
            </TypographyH6>
          </Link>
        ) : undefined}
        <NavigationMenuList className="space-x-1 sm:space-x-2">
          {items.map(item => (
            <NavigationMenuItem key={item.title}>
              <NavigationMenuTrigger className="relative flex items-center gap-1 sm:gap-2 !z-0 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
                {item.title}
              </NavigationMenuTrigger>
              <NavigationMenuContent
                className={'max-h-[calc(100dvh_-_126px)] overflow-y-auto'}
              >
                <Suspense fallback={<LoadingIndicator />}>
                  <ul className="grid gap-2 p-2 w-[340px] md:w-[500px] lg:w-[700px] lg:grid-cols-[1fr_1fr]">
                    {item.links.map(link => (
                      <ListItem
                        key={`/${link.segments.join('/')}`}
                        href={`/${link.segments.join('/')}`}
                        title={link.label}
                        mediaUrl={link.mediaUrl}
                        className="text-xs !py-2 !px-2"
                      >
                        {link.description}
                      </ListItem>
                    ))}
                  </ul>
                </Suspense>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ))}
          <NavigationMenuIndicator />
        </NavigationMenuList>

        <NavigationMenuViewport />
      </NavigationMenu>
    </div>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & { mediaUrl?: string }
>(({ className, href, title, children, mediaUrl, ...props }, ref) => {
  const pathname = usePathname()
  const isActive = href === pathname

  return (
    <li>
      <NavigationMenuLink
        asChild
        active={isActive}
        className={cn([
          navigationMenuTriggerStyle(),
          'flex flex-col items-start h-auto w-full',
        ])}
      >
        <Link
          prefetch={false}
          href={href || ''}
          ref={ref}
          className={cn(
            'flex !flex-row items-center !justify-start gap-3  select-none space-y-1 rounded-md p-2 sm:p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className,
          )}
          {...props}
        >
          <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden">
            {mediaUrl ? (
              <ToolCardMedia
                variant="thumbnail"
                mediaUrl={getMediaUrl(mediaUrl)}
                title={title}
              />
            ) : (
              <Skeleton className="w-full h-full" />
            )}
          </div>
          <div>
            <div className="text-xs md:text-sm font-medium leading-none">
              {title}
            </div>
            <p className="line-clamp-1 md:line-clamp-2 text-xs leading-snug text-muted-foreground">
              {children}
            </p>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = 'ListItem'

export default MobileSecondaryNav
