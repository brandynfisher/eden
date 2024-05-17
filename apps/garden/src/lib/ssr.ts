import {
  maybeRedirectIfCharacterIdQuery,
  maybeRedirectIfConceptIdQuery,
  maybeRedirectIfCreationIdQuery,
} from '@/lib/redirect'
import { GetServerSidePropsContext } from 'next'

type FieldRequest = {
  responseFieldName: string
  dataFetcher: (ctx: GetServerSidePropsContext) => Promise<{ [key: string]: string }>
}

export const handleQueryStringRedirects = async (ctx: GetServerSidePropsContext) => {
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

  return false
}

export const getServerSidePropsBase = (fieldRequests: FieldRequest[]) => {
  return async (ctx: GetServerSidePropsContext) => {
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
      console.error('SSR caughgt error', err)
      return { props: { data: null, error: 'Something went wrong' } }
    }
  }
}
