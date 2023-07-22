import { maybeRedirectIfCreationIdQuery } from '@/lib/redirect'
import { NextPageContext } from 'next'

export const getServerSidePropsBase = (
  responseFieldName: string,
  dataFetcher: (ctx: NextPageContext) => Promise<{ [key: string]: string }>,
) => {
  return async (ctx: NextPageContext) => {
    await maybeRedirectIfCreationIdQuery(ctx)

    try {
      const data = await dataFetcher(ctx)

      if (!data || !data[responseFieldName]) {
        return {
          notFound: true,
        }
      }

      return { props: { data: data[responseFieldName] } }
    } catch (err) {
      return { props: { error: 'Something went wrong' } }
    }
  }
}
