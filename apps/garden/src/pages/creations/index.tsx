import HomePage from '@/components/Pages/HomePage'
import { maybeRedirectIfItemIdQuery } from '@/lib/redirect'
import { GetServerSidePropsContext } from 'next'
import React from 'react'

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  return maybeRedirectIfItemIdQuery(ctx)
}

const creations = () => {
  return <HomePage />
}

export default creations
