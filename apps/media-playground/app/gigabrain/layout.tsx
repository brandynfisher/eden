import localFont from 'next/font/local'
import { ReactNode } from 'react'

const kumarOne = localFont({
  src: '../fonts/kumar-one.ttf',
  variable: '--font-kumar-one',
  display: 'swap',
  weight: '400',
})

export default function GigabrainLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${kumarOne.variable} w-full flex-1 min-h-0 overflow-y-auto`}
    >
      {children}
    </div>
  )
}
