import LoadingIndicator from '@/components/LoadingIndicator'
import {
  ClerkLoaded,
  ClerkLoading,
  RedirectToUserProfile,
  SignUp,
  SignedIn,
  SignedOut,
} from '@clerk/nextjs'

const SignUpPage = () => {
  return (
    <div className="flex justify-center items-center">
      <ClerkLoading>
        <LoadingIndicator />
      </ClerkLoading>
      <ClerkLoaded>
        <SignedIn>
          <RedirectToUserProfile />
        </SignedIn>
        <SignedOut>
          <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
        </SignedOut>
      </ClerkLoaded>
    </div>
  )
}

export default SignUpPage
