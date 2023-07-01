import { NextPageContext } from 'next'

// this is used for the pattern of opening modal, replacing url and presenting the detail page on refresh
export const maybeRedirectIfCreationIdQuery = async (
  context: NextPageContext,
) => {
  const { query } = context
  const creationId = query.creationId ? query.creationId : false

  if (creationId) {
    const { res } = context

    if (res) {
      return {
        redirect: {
          destination: `/creations/${creationId}`,
          statusCode: 307,
        },
      }
    }
  }
}
