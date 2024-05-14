import HomePage from '@/components/Pages/HomePage'
import { maybeRedirectIfItemIdQuery } from '@/lib/redirect'
import { NextPageContext } from 'next'
import React from 'react'

export async function getServerSideProps(ctx: NextPageContext) {
  return maybeRedirectIfItemIdQuery(ctx)
}

const Creations = () => {
  return <HomePage />
}

export default Creations
