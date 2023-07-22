import { maybeRedirectIfCreationIdQuery } from '@/lib/redirect'
import MePage from '@/pages/me/MePage'
import { UserContext } from '@/providers/UserProvider'
import { NextPageContext } from 'next'
import React, { useContext } from 'react'

export async function getServerSideProps(ctx: NextPageContext) {
  return (await maybeRedirectIfCreationIdQuery(ctx)) || { props: {} }
}

const Me = () => {
  const { address, isConnected } = useContext(UserContext)

  if (!isConnected || !address) {
    return null
  }

  return <MePage address={address} />
}

export default Me
