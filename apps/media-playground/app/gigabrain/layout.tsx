import { Kumar_One } from 'next/font/google'
import { ReactNode } from 'react'

const kumarOne = Kumar_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-kumar-one',
  display: 'swap',
})

export default function GigabrainLayout({ children }: { children: ReactNode }) {
  return <div className={kumarOne.variable}>{children}</div>
}
