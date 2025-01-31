'use client'

import DiscordIcon from '@/components/icons/discord'
import TwitterIcon from '@/components/icons/twitter'
import { Button } from '@/components/ui/button'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { siteConfig } from '@/lib/config'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import Link from 'next/link'

export default function SectionDeploy() {
  return (
    <div className="max-w-3xl mx-auto">
      <TypographyH4 className="text-2xl font-semibold mb-6 text-center">
        Deploy Your Agent Wherever Your Audience Is
      </TypographyH4>
      <p className="text-center text-muted-foreground mb-6">
        Once you've built your custom agent on Eden, you can deploy it to
        platforms like Discord, X, Telegram, and Farcaster. Create consistent,
        scalable content and keep your audience engaged across all your favorite
        channels.
      </p>
      <div className="flex justify-center items-center gap-4">
        <Button variant="ghost" size={'icon'} asChild>
          <Link
            href={siteConfig.links.discord}
            target="_blank"
            className="filter flex flex-col p-4 rounded-lg border border-border bg-card h-16 w-16"
          >
            <VisuallyHidden>Discord</VisuallyHidden>
            <DiscordIcon size={64} />
          </Link>
        </Button>
        <Button variant="ghost" size={'icon'} asChild>
          <Link
            href={siteConfig.links.twitter}
            target="_blank"
            className="group  flex flex-col p-4 rounded-lg border border-border bg-card h-16 w-16"
          >
            <VisuallyHidden>X</VisuallyHidden>
            <TwitterIcon size={64} />
          </Link>
        </Button>
        {/* <div className="flex flex-col p-4 rounded-lg border border-border bg-card">
                TG
              </div>
              <div className="flex flex-col p-4 rounded-lg border border-border bg-card">
                FC
              </div> */}
      </div>
    </div>
  )
}
