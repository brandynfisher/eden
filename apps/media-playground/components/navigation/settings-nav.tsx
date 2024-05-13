import { Separator } from '@/components/ui/separator'
import SettingsNavLinks from '@/components/navigation/settings-nav-links'

const SettingsNav = () => {

  return (
    <nav className="grid gap-4 text-sm text-muted-foreground">
      <SettingsNavLinks />
      <Separator orientation="horizontal" className="md:hidden" />
    </nav>
  )
}

export default SettingsNav