'use client'

import { SignIn } from '@clerk/nextjs'
import { useTheme } from 'next-themes'
import { dark } from '@clerk/themes'

const SignInThemed = () => {
  const { theme } = useTheme()
  const clerkTheme =  theme === 'dark' ? dark : undefined

  return (
    <SignIn appearance={{ baseTheme: clerkTheme }}/>
  )
}

export default SignInThemed