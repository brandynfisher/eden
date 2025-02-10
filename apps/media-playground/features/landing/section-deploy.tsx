'use client'

import DiscordIcon from '@/components/icons/discord'
import { FarcasterIcon } from '@/components/icons/farcaster'
import { TelegramIcon } from '@/components/icons/telegram'
import TwitterIcon from '@/components/icons/twitter'
import { Badge } from '@/components/ui/badge'
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
      <div className="flex justify-center items-center gap-4 md:gap-8">
        <div className="flex flex-col items-center gap-2">
          <Button variant="ghost" size={'icon'} asChild>
            <Link
              href={siteConfig.links.discord}
              target="_blank"
              className="filter flex flex-col p-4 rounded-lg border border-border bg-card h-20 w-20 transition-colors hover:border-[#5865F2]"
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
              className="group flex flex-col p-4 rounded-lg border border-border bg-card h-20 w-20 transition-colors hover:border-black dark:hover:border-white"
            >
              <TwitterIcon size={64} className="text-black dark:text-white" />
            </Link>
          </Button>
          <div className="text-muted-foreground font-medium">X</div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Button variant="ghost" size={'icon'} asChild>
            <Link
              href={'#'}
              target="_blank"
              className="group flex flex-col p-4 rounded-lg border border-border bg-card h-20 w-20 transition-colors hover:border-[#26A5E4]"
            >
              <TelegramIcon size={64} className="text-[#26A5E4]" />
            </Link>
          </Button>
          <div className="text-muted-foreground font-medium">Telegram</div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Button variant="ghost" size={'icon'} asChild disabled>
            <Link
              href={'#'}
              target="_blank"
              className="group flex flex-col p-4 rounded-lg border border-border bg-card h-20 w-20 transition-colors hover:border-[#855DCD] relative opacity-60"
            >
              <FarcasterIcon size={64} className="text-[#855DCD]" />
              <Badge
                className="absolute -top-2 -right-2 opacity-100 bg-[#855DCD]"
                variant="outline"
              >
                Soon
              </Badge>
            </Link>
          </Button>
          <div className="text-muted-foreground font-medium">Farcaster</div>
        </div>
      </div>
    </div>
  )
}
