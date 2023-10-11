import { useLocalStorage } from '@mantine/hooks'
import { Alert, Button, Input } from 'antd'
import React, { PropsWithChildren, useEffect, useState } from 'react'

const PasswordProtection = ({ children }: PropsWithChildren) => {
  const [password, setPassword] = useState('')

  const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD

  const [localStoragePasswordCorrect, setLocalStoragePasswordCorrect] =
    useLocalStorage<boolean>({
      key: 'beta-password',
      defaultValue: false,
    })

  const [access, setAccess] = useState<boolean | null>(null)

  console.log({ localStoragePasswordCorrect })

  useEffect(() => {
    if (localStoragePasswordCorrect) {
      setAccess(true)
    }
  }, [localStoragePasswordCorrect])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAccess(null)

    if (!password) return

    if (password === correctPassword) {
      setAccess(true)
      setLocalStoragePasswordCorrect(true)
    } else {
      setAccess(false)
      setLocalStoragePasswordCorrect(false)
    }
  }

  if (!access && process.env.NEXT_PUBLIC_APP_PASSWORD) {
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
                  Eden is on the move!
                </h2>
                <div className="mx-auto max-w-[528px] mb-5 md:mb-6 lg:mb-8">
                  <p className="text-[#636262] max-[479px]:text-sm">
                    The Garden 🌿 is going through a big migration today and
                    needs beta testers!
                    <br />
                    If you're interested in testing, come to{' '}
                    <strong>
                      <a href="https://discord.com/invite/4dSYwDT">Discord</a>
                    </strong>{' '}
                    and message us.
                    <br />
                    It will be open for all again tomorrow.
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                  <div>Beta testers can enter with a password: </div>
                  <Input
                    placeholder="Enter password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  {access === false && password !== '' ? (
                    <Alert
                      type="error"
                      message="Wrong password"
                      description="Find us on Discord to get access to this test"
                    />
                  ) : null}
                  <Button type="primary" disabled={!password}>
                    Enter
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  } else {
    return <>{children}</>
  }
}

export default PasswordProtection
