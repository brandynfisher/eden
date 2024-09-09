import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { UserProfile } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

const SettingsAccountPage = () => {
  return (
    <>
      <TypographyH4>Account</TypographyH4>
      <UserProfile
        appearance={{
          baseTheme: dark,
        }}
      />
    </>
  )
}

export default SettingsAccountPage
