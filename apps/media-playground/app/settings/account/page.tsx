import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const SettingsAccountPage = () => {
  return (
    <>
      <TypographyH4>Account</TypographyH4>
      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>Social login....</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <Input placeholder="Your Login" />
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Save</Button>
        </CardFooter>
      </Card>
    </>
  )
}

export default SettingsAccountPage
