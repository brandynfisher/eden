import {
  maybeRedirectIfCharacterIdQuery,
  maybeRedirectIfConceptIdQuery,
  maybeRedirectIfCreationIdQuery,
} from '@/lib/redirect'
import { NextPageContext } from 'next'

type FieldRequest = {
  responseFieldName: string
  dataFetcher: (ctx: NextPageContext) => Promise<{ [key: string]: string }>
}

export const getServerSidePropsBase = (fieldRequests: FieldRequest[]) => {
  return async (ctx: NextPageContext) => {
    try {
      const shouldRedirectToCreationDetail =
        await maybeRedirectIfCreationIdQuery(ctx)

      if (shouldRedirectToCreationDetail) {
        return shouldRedirectToCreationDetail
      }

      const shouldRedirectToConceptDetail = await maybeRedirectIfConceptIdQuery(
        ctx,
      )

      if (shouldRedirectToConceptDetail) {
        return shouldRedirectToConceptDetail
      }

      const shouldRedirectToCharacterDetail =
        await maybeRedirectIfCharacterIdQuery(ctx)

      if (shouldRedirectToCharacterDetail) {
        return shouldRedirectToCharacterDetail
      }

      const allFieldResults = await Promise.all(
        fieldRequests.map(async fieldRequest => {
          const data = await fieldRequest.dataFetcher(ctx)

          if (!data || !data[fieldRequest.responseFieldName]) {
            return false
          }

          return data
        }),
      )

      if (allFieldResults[0] === false) {
        return { notFound: true }
      }

      return { props: { data: allFieldResults[0] } }
    } catch (err) {
      console.error(err)
      return { props: { data: null, error: 'Something went wrong' } }
    }
  }
}
