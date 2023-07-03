import Link from 'next/link'
import React from 'react'

const HeaderLogo = () => {
  return (
    <div className="demo-logo">
      <Link href="/">
        <img
          src="/favicon-32x32.png"
          alt="Logo"
          style={{ height: '32px', top: '-1px' }}
          className="relative"
        />
      </Link>
    </div>
  )
}
export default HeaderLogo
