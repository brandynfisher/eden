import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const SettingsAPIPage = () => {
  return (
    <>
      <TypographyH4>API Keys</TypographyH4>
      <Card>
        <Card>
          <CardHeader>
            <CardTitle>Create</CardTitle>
            <CardDescription>Manage API keys for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <Input placeholder='API Key 1' />
            </form>
            <form>
              <Input placeholder='API Key 2' />
            </form>
            <form>
              <Input placeholder='API Key 3' />
            </form>
            <form>
              <Input placeholder='API Key 4' />
            </form>
          </CardContent>
          <CardFooter className='border-t px-6 py-4'>
            <Button>Save</Button>
          </CardFooter>
        </Card>
      </Card>
    </>
  )
}

export default SettingsAPIPage
