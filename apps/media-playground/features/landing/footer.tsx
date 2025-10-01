import DiscordIcon from '@/components/icons/discord'
import TwitterIcon from '@/components/icons/twitter'
import EdenLogoBw from '@/components/logo/eden-logo-bw'
import { Button } from '@/components/ui/button'
import { siteConfig } from '@/lib/config'
import { GitHubLogoIcon, InstagramLogoIcon } from '@radix-ui/react-icons'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { BookOpenTextIcon } from 'lucide-react'
import Link from 'next/link'
import { FC } from 'react'

export const Footer: FC = () => {
  return (
    <div className="flex items-center justify-center w-full bg-accent py-2 px-4">
      <div className="w-full max-w-3xl flex items-center justify-between">
        <div className="flex gap-1 items-center">
          <EdenLogoBw className="w-8 h-auto" />
          <div className="ml-2 text-xs text-muted-foreground">
            © 2025 Eden Labs, Inc.
            <br />
            <Link
              className="text-xs hover:underline text-muted-foreground/60"
              href={`https://docs.eden.art/legal/tos`}
              prefetch={false}
              target="_blank"
            >
              <span>Terms</span>
            </Link>
            <span className="text-xs mx-1">|</span>
            <Link
              className="text-xs hover:underline text-muted-foreground/60"
              href={`https://docs.eden.art/legal/privacy`}
              prefetch={false}
              target="_blank"
            >
              <span>Privacy Policy</span>
            </Link>
          </div>
        </div>
        <div className="flex gap-1 items-center">
          <Button variant="ghost" size={'icon'} asChild>
            <Link
              href={siteConfig.links.discord}
              target="_blank"
              className="filter grayscale hover:grayscale-0"
            >
              <VisuallyHidden>Discord</VisuallyHidden>
              <DiscordIcon size={20} />
            </Link>
          </Button>
          <Button variant="ghost" size={'icon'} asChild>
            <Link
              href={siteConfig.links.instagram}
              target="_blank"
              className="group grayscale hover:grayscale-0 hover:text-white"
            >
              <VisuallyHidden>Instagram</VisuallyHidden>
              <InstagramLogoIcon className="brightness-50 group-hover:!brightness-100 size-5" />
            </Link>
          </Button>
          <Button variant="ghost" size={'icon'} asChild>
            <Link
              href={siteConfig.links.twitter}
              target="_blank"
              className="group grayscale hover:grayscale-0 hover:text-white"
            >
              <VisuallyHidden>X</VisuallyHidden>
              <TwitterIcon
                size={18}
                className="brightness-50 group-hover:!brightness-100"
              />
            </Link>
          </Button>
          <Button variant="ghost" size={'icon'} asChild>
            <Link
              href={siteConfig.links.github}
              target="_blank"
              className="group grayscale hover:grayscale-0 hover:text-white"
            >
              <VisuallyHidden>GitHub</VisuallyHidden>
              <GitHubLogoIcon className="brightness-50 group-hover:!brightness-100 size-5" />
            </Link>
          </Button>
          <Button variant="ghost" size={'icon'} asChild>
            <Link
              href={siteConfig.links.documentation}
              target="_blank"
              className="group grayscale hover:grayscale-0 hover:text-white"
            >
              <VisuallyHidden>Documentation</VisuallyHidden>
              <BookOpenTextIcon className="brightness-50 group-hover:!brightness-100 size-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
