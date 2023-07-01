import { maybeRedirectIfCreationIdQuery } from '@/lib/redirect'
import HomePage from '@/pages/HomePage'
import { NextPageContext } from 'next'
import React from 'react'

export async function getServerSideProps(ctx: NextPageContext) {
  return (await maybeRedirectIfCreationIdQuery(ctx)) || { props: {} }
}

const creations = () => {
  return <HomePage />
}

export default creations
