import EdenLogoBw from '@/components/logo/eden-logo-bw'
import { DiscordLogoIcon, TwitterLogoIcon } from '@radix-ui/react-icons'
import { InstagramLogoIcon } from '@radix-ui/react-icons'
import { BookOpenIcon, GithubIcon } from 'lucide-react'
import Link from 'next/link'

export function HomeFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-16">
      <div className="container mx-auto px-8 md:px-12 lg:px-16 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <EdenLogoBw width={32} height={32} className="w-8 h-8" />
              <span className="font-semibold text-lg">Eden</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              The Garden of Artificial Delights
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="https://discord.gg/4dSYwDT"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Discord"
              >
                <DiscordLogoIcon className="w-5 h-5" />
              </Link>
              <Link
                href="https://twitter.com/eden_art_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <TwitterLogoIcon className="w-5 h-5" />
              </Link>
              <Link
                href="https://instagram.com/eden.art_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <InstagramLogoIcon className="w-5 h-5" />
              </Link>
              <Link
                href="https://github.com/edenartlab"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <GithubIcon className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div className="md:col-span-1">
            <h3 className="font-semibold text-sm mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="https://docs.eden.art"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <BookOpenIcon className="w-3 h-3" />
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/edenartlab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <GithubIcon className="w-3 h-3" />
                  GitHub
                </Link>
              </li>
              <li>
                <Link
                  href="https://discord.gg/4dSYwDT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-1">
            <h3 className="font-semibold text-sm mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-border/40">
          <p className="text-sm text-muted-foreground text-center">
            © {currentYear} Eden Labs, Inc.
          </p>
        </div>
      </div>
    </footer>
  )
}
