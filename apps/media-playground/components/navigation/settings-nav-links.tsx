import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

const SettingsNavLinks = () => {
  return (
    <>
      <div className="flex flex-col gap-2 text-foreground/90">
        <div className="text-muted-foreground font-bold text-xs">General</div>
        <Link href="/settings/account" className="px-2 py-1.5">
          Account
        </Link>
        <Link href="/settings/integrations" className="px-2 py-1.5">
          Integrations
        </Link>
        <Link href="/settings/subscription" className="px-2 py-1.5">
          Subscription
        </Link>
      </div>

      <div className="flex flex-col gap-2 text-foreground/90">
        <div className="text-muted-foreground font-bold text-xs">
          Developers
        </div>
        <Link href="/settings/api" className="px-2 py-1.5">
          API Keys
        </Link>
      </div>
      <Separator orientation="horizontal" className="md:hidden" />
    </>
  )
}

export default SettingsNavLinks
