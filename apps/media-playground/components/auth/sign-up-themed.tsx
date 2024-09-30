'use client'

import { SignUp } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

const SignUpThemed = () => {
  return <SignUp appearance={{ baseTheme: dark }} />
}

export default SignUpThemed
