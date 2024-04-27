import { PropsWithChildren } from 'react'
import Link from 'next/link'
import TypographyH3 from '@/components/ui/typography/TypographyH3'
import TypographyH4 from '@/components/ui/typography/TypographyH4'

const PageLayout = ({ children }: PropsWithChildren) => {
  return (
    <div data-testid="content" className="flex-grow">
      <div className='mx-auto grid w-full max-w-6xl gap-2 mb-4'>
        <h1 className='text-3xl font-semibold'>Settings</h1>
      </div>
      <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
        <nav className="grid gap-4 text-sm text-muted-foreground">
          {/*<TypographyH4>Settings</TypographyH4>*/}
          <Link className="font-semibold text-primary" href="/account/settings/general">
            General
          </Link>
          <Link href="/account/settings/integrations">Integrations</Link>
          <Link href="/account/settings/api">API Keys</Link>
          <Link href="/account/settings/subscription">Subscription</Link>
        </nav>
        <div className="grid gap-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export default PageLayout