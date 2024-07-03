'use client'

import { SignUp } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from 'next-themes'

const SignUpThemed = () => {
  const { theme } = useTheme()
  const clerkTheme = theme === 'dark' ? dark : undefined

  return <SignUp appearance={{ baseTheme: clerkTheme }} />
}

export default SignUpThemed
