import * as Linking from 'expo-linking'
import { useEffect, useRef } from 'react'
import { useSignIn, useSignUp } from '@clerk/clerk-expo'

const extractNonce = (url: string) => {
  try {
    const parsed = Linking.parse(url)
    const nonce = parsed.queryParams?.rotating_token_nonce
    return typeof nonce === 'string' ? nonce : undefined
  } catch {
    return undefined
  }
}

export default function SsoCallbackHandler() {
  const { signIn, setActive, isLoaded: isSignInLoaded } = useSignIn()
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp()
  const handledNonceRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isSignInLoaded || !isSignUpLoaded) return

    const handleUrl = async (url?: string | null) => {
      if (!url) return
      const nonce = extractNonce(url)
      if (!nonce || handledNonceRef.current === nonce) return
      handledNonceRef.current = nonce

      try {
        await signIn.reload({ rotatingTokenNonce: nonce })
        if (signIn.firstFactorVerification?.status === 'transferable') {
          await signUp.create({ transfer: true })
        }
        const sessionId = signUp.createdSessionId || signIn.createdSessionId
        if (sessionId) {
          await setActive({ session: sessionId })
        }
      } catch (err) {
        console.warn('SSO callback handling failed', err)
      }
    }

    Linking.getInitialURL().then(handleUrl)

    const subscription = Linking.addEventListener('url', event => {
      handleUrl(event.url)
    })

    return () => subscription.remove()
  }, [isSignInLoaded, isSignUpLoaded, signIn, signUp, setActive])

  return null
}
