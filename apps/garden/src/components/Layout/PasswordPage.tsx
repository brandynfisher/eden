import React, { PropsWithChildren, useState } from 'react'

const PasswordProtection = ({ children }: PropsWithChildren) => {
  const [password, setPassword] = useState('')
  const [access, setAccess] = useState(false)

  const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (password === correctPassword) {
      setAccess(true)
    } else {
      alert('Incorrect password')
    }
  }

  if (!access && process.env.NEXT_PUBLIC_APP_PASSWORD) {
    return (
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit">Enter</button>
      </form>
    )
  } else {
    return <>{children}</>
  }
}

export default PasswordProtection
