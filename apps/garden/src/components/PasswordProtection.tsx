import { FormEvent, ReactNode, useState } from 'react'

type PasswordProtectionProps = {
  children: ReactNode
}

export default function PasswordProtection({
  children,
}: PasswordProtectionProps) {
  const [password, setPassword] = useState('')
  const [isPwAuthenticated, setIsPwAuthenticated] = useState(false)

  const handlePasswordSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (password === process.env.NEXT_PUBLIC_APP_PASSWORD) {
      setIsPwAuthenticated(true)
    } else {
      alert('Incorrect password')
    }
  }

  if (process.env.NEXT_PUBLIC_APP_PASSWORD && !isPwAuthenticated) {
    return (
      <form onSubmit={handlePasswordSubmit}>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter password"
        />
        <button type="submit">Submit</button>
      </form>
    )
  }

  return <>{children}</>
}
