'use client'

import { useClerk, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { ReactNode, createContext, useContext } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: ReturnType<typeof useUser>['user']
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded: isClerkLoaded, user, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/sign-in')
  }

  if (!isClerkLoaded) {
    return null
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isSignedIn || false,
        isLoading: !isClerkLoaded,
        user,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
