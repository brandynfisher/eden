import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const HeaderLogo = () => {
  return (
    <div className="demo-logo">
      <Link href="/" className="block h-full w-full">
        <Image
          width={32}
          height={32}
          priority={true}
          src="/favicon-32x32.png"
          alt="Logo"
          className="relative"
        />
      </Link>
    </div>
  )
}
export default HeaderLogo
