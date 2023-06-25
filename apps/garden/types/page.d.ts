import { NextPage } from 'next'
import { ReactElement, ReactNode } from 'react'

export type Page<P = NonNullable<unknown>> = NextPage<P> & {
  getLayout?: (page: ReactElement) => ReactNode
}
