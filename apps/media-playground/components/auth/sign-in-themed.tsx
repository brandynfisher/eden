'use client'

import { SignIn } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

const SignInThemed = () => {
  return <SignIn appearance={{ baseTheme: dark }} />
}

export default SignInThemed
