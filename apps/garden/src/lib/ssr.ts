import {
  maybeRedirectIfConceptIdQuery,
  maybeRedirectIfCreationIdQuery,
} from '@/lib/redirect'
import { withSessionSsr } from '@/lib/withSession'
import { NextPageContext } from 'next'

type FieldRequest = {
  responseFieldName: string
  dataFetcher: (ctx: NextPageContext) => Promise<{ [key: string]: string }>
}

export const getServerSidePropsBase = (
  fieldRequests: FieldRequest[],
  useSessionSsr?: boolean,
) => {
  const getServerSideProps = async (ctx: NextPageContext) => {
    const shouldRedirectToCreationDetail = await maybeRedirectIfCreationIdQuery(
      ctx,
    )

    if (shouldRedirectToCreationDetail) {
      return shouldRedirectToCreationDetail
    }

    const shouldRedirectToConceptDetail = await maybeRedirectIfConceptIdQuery(
      ctx,
    )

    if (shouldRedirectToConceptDetail) {
      return shouldRedirectToConceptDetail
    }

    try {
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
      return { props: { data: null, error: 'Something went wrong' } }
    }
  }

  //@ts-ignore
  return useSessionSsr ? withSessionSsr(getServerSideProps) : getServerSideProps
}
