import { useLocalStorage } from '@mantine/hooks'
import { Alert, Input } from 'antd'
import React, { PropsWithChildren, useEffect, useState } from 'react'

import LoadingIndicator from '../LoadingIndicator'

const PasswordProtectionPageWrap = ({ children }: PropsWithChildren) => {
  if (!process.env.NEXT_PUBLIC_APP_PASSWORD) {
    return <>{children}</>
  }

  return <PasswordProtectionPage>{children}</PasswordProtectionPage>
}

const PasswordProtectionPage = ({ children }: PropsWithChildren) => {
  const [password, setPassword] = useState('')

  const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD

  const [localStoragePasswordCorrect, setLocalStoragePasswordCorrect] =
    useLocalStorage<boolean>({
      key: 'beta-password',
    })

  const [access, setAccess] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    setAccess(localStoragePasswordCorrect)
  }, [localStoragePasswordCorrect])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAccess(undefined)

    if (!password) return

    if (password === correctPassword) {
      setAccess(true)
      setLocalStoragePasswordCorrect(true)
    } else {
      setAccess(false)
      setLocalStoragePasswordCorrect(false)
    }
  }

  if (typeof access === 'undefined') {
    return (
      <div className="absolute inset-0">
        <LoadingIndicator />
      </div>
    )
  }

  if (access) {
    return <>{children}</>
  }

  return (
    <section className="block">
      <div className="px-5 md:px-10">
        <div className="py-4 md:py-8 lg:py-16">
          <div className="mx-auto flex-col flex w-full max-w-3xl items-center">
            <img
              src="/placeholder.png"
              alt=""
              className="mb-8 mx-auto inline-block h-16 w-16 max-w-full flex-none object-cover"
            />
            <div className="text-center">
              <h2 className="font-bold mb-4 text-2xl md:text-4xl">
                The Garden 🌿
              </h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <Input
                  placeholder="Enter password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                {!access && password !== '' ? (
                  <Alert
                    type="error"
                    message="Wrong password"
                    description="Find us on Discord to get access"
                  />
                ) : null}
                <button
                  className="rounded-lg bg-blue-500 disabled:bg-gray-950 border-none py-2"
                  type="submit"
                  disabled={!password}
                >
                  Enter
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PasswordProtectionPageWrap
