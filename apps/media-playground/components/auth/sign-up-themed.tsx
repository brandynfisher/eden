'use client'

import { SignUp } from '@clerk/nextjs'
import { useTheme } from 'next-themes'
import { dark } from '@clerk/themes'

const SignUpThemed = () => {
  const { theme } = useTheme()
  const clerkTheme =  theme === 'dark' ? dark : undefined

  return (
    <SignUp appearance={{ baseTheme: clerkTheme }}/>
  )
}

export default SignUpThemed