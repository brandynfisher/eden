'use client'

import { SignIn } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from 'next-themes'

const SignInThemed = () => {
  const { resolvedTheme } = useTheme()
  const clerkTheme = resolvedTheme === 'light' ? undefined : dark

  return <SignIn appearance={{ baseTheme: clerkTheme }} />
}

export default SignInThemed
