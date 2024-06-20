import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import TypographyH4 from '@/components/ui/typography/TypographyH4'

const SettingsIntegrationsPage = () => {
  return (
    <>
      <TypographyH4>Integrations</TypographyH4>
      <Card>
        <CardHeader>
          <CardTitle>Discord</CardTitle>
          <CardDescription>
            Connect your Discord account to Eden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <Input placeholder="Your Discord User ID" />
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Save</Button>
        </CardFooter>
      </Card>
    </>
  )
}

export default SettingsIntegrationsPage
