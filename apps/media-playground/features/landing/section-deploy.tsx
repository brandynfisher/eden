'use client'

import DiscordIcon from '@/components/icons/discord'
import TwitterIcon from '@/components/icons/twitter'
import { Button } from '@/components/ui/button'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { siteConfig } from '@/lib/config'
import Link from 'next/link'

export default function SectionDeploy() {
  return (
    <div className="max-w-3xl mx-auto">
      <TypographyH4 className="text-2xl font-semibold mb-6 text-center">
        Export Your Agent Anywhere
      </TypographyH4>
      <p className="text-center text-muted-foreground mb-6">
        Take your AI agents beyond Eden - deploy them across multiple platforms
        to engage with your audience where you want.
      </p>
      <div className="flex justify-center items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <Button variant="ghost" size={'icon'} asChild>
            <Link
              href={siteConfig.links.discord}
              target="_blank"
              className="filter flex flex-col p-4 rounded-lg border border-border bg-card h-20 w-20"
            >
              <DiscordIcon size={64} />
            </Link>
          </Button>
          <div className="text-muted-foreground font-medium">Discord</div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Button variant="ghost" size={'icon'} asChild>
            <Link
              href={siteConfig.links.twitter}
              target="_blank"
              className="group  flex flex-col p-4 rounded-lg border border-border bg-card h-20 w-20"
            >
              <TwitterIcon size={64} />
            </Link>
          </Button>
          <div className="text-muted-foreground font-medium">X</div>
        </div>
      </div>
      {/* <div className="mt-6 flex flex-col justify-center items-center bg-secondary/50 rounded-lg">
        <Skeleton className="w-full aspect-video" />
        <Separator className="w-full" />
        <div className="p-4">
          <TypographyH5 className="font-semibold m-0 mb-2">
            Watch Your Agent in Action
          </TypographyH5>
          <div className="text-muted-foreground">
            See how our agents seamlessly integrate across different platforms,
            maintaining their unique personality and capabilities.
          </div>
        </div>
      </div> */}
    </div>
  )
}
