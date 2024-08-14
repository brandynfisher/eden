'use client'

import RotatingEdenLogo from '@/components/logo/rotating-eden-logo'
import { Button } from '@/components/ui/button'
import TypographyH3 from '@/components/ui/typography/TypographyH3'
import { useAuthState } from '@/hooks/use-auth-state'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const ConciergeContent = () => {
  const { isSignedIn, hasEden2EarlyAccess } = useAuthState()
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn && hasEden2EarlyAccess()) {
      router.push('/create')
    }
  }, [router, isSignedIn, hasEden2EarlyAccess])

  return (
    <div className="flex flex-col items-center justify-center">
      <TypographyH3>
        Eden Create is in <span className="italic"> Early Access</span>
      </TypographyH3>

      <div className="flex items-center my-4 opacity-75">
        <RotatingEdenLogo variant={'medium'} />
      </div>

      <div className="flex gap-2 mt-8">
        <Button asChild variant="secondary">
          <a href={'https://eden.art/early-access'} target={'_blank'}>
            Join the wait list!
          </a>
        </Button>
        <Button variant={'outline'} asChild>
          <a href={'https://eden.art/create-beta'} target={'_blank'}>
            Learn more
          </a>
        </Button>
      </div>
      <div className="mt-8">
        <Button asChild variant="link">
          <Link href={'/sign-in'}>
            Already whitelisted? Click here to login
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default ConciergeContent
