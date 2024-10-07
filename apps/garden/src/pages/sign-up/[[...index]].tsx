import { SignUp } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export default function Page() {
  return (
    <div className="flex items-center justify-center">
      <SignUp
        appearance={{
          baseTheme: dark,
          layout: {
            socialButtonsPlacement: 'bottom',
            socialButtonsVariant: 'iconButton',
            termsPageUrl: 'https://app.eden.art/terms',
            privacyPageUrl: 'https://app.eden.art/privacy',
            helpPageUrl: 'https://app.eden.art/help',
            logoImageUrl: 'https://app.eden.art/eden-logo-512x512.png',
          },
        }}
      />
    </div>
  )
}
