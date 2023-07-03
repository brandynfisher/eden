import { maybeRedirectIfCreationIdQuery } from '@/lib/redirect'
import MePage from '@/pages/me/MePage'
import { NextPageContext } from 'next'
import React from 'react'

export async function getServerSideProps(ctx: NextPageContext) {
  return (await maybeRedirectIfCreationIdQuery(ctx)) || { props: {} }
}

const Me = () => {
  return <MePage />
}

export default Me
