import LoginOrVoucher from '@/components/form/login-or-voucher'
import RotatingEdenLogo from '@/components/logo/rotating-eden-logo'
import { Button } from '@/components/ui/button'
import TypographyH3 from '@/components/ui/typography/TypographyH3'

const ConciergeContent = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <TypographyH3 className="mt-4">
        Eden Create is in <span className="italic"> Private Beta</span>
      </TypographyH3>

      <div className="flex items-center my-4 opacity-75">
        <RotatingEdenLogo variant={'medium'} />
      </div>

      <div className="flex gap-2 mt-8">
        <Button asChild variant="secondary">
          <a href={'https://eden.art/early-access'} target={'_blank'}>
            Join the Waitlist!
          </a>
        </Button>
        <Button variant={'outline'} asChild>
          <a href={'https://eden.art/create-beta'} target={'_blank'}>
            Learn more
          </a>
        </Button>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <LoginOrVoucher />
      </div>
    </div>
  )
}

export default ConciergeContent
