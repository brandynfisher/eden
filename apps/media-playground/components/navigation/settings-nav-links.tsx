import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

const SettingsNavLinks = () => {
  return (
    <>
      <Link className="font-semibold text-primary" href="/account/settings/general">
        General
      </Link>
      <Link href="/account/settings/integrations">Integrations</Link>
      <Link href="/account/settings/api">API Keys</Link>
      <Link href="/account/settings/subscription">Subscription</Link>
      <Separator orientation="horizontal" className="md:hidden" />
    </>
  )
}

export default SettingsNavLinks