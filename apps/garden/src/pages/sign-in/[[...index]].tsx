import LoadingIndicator from '@/components/LoadingIndicator'
import {
  ClerkLoaded,
  ClerkLoading,
  RedirectToUserProfile,
  SignIn,
  SignedIn,
  SignedOut,
} from '@clerk/nextjs'

const SignInPage = () => {
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
          <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
        </SignedOut>
      </ClerkLoaded>
    </div>
  )
}
export default SignInPage
