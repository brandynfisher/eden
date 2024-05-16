import { GetServerSidePropsContext, Redirect } from 'next'

// this is used for the pattern of opening modal, replacing url and presenting the detail page on refresh
export const maybeRedirectIfCreationIdQuery = async (
  context: GetServerSidePropsContext,
): Promise<false|{redirect: Redirect}> => {
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

  return false
}

export const maybeRedirectIfConceptIdQuery = async (
  context: GetServerSidePropsContext,
): Promise<false|{redirect: Redirect}> => {
  const { query } = context
  const conceptId = query.conceptId ? query.conceptId : false

  if (conceptId) {
    const { res } = context

    if (res) {
      return {
        redirect: {
          destination: `/concepts/${conceptId}`,
          statusCode: 307,
        },
      }
    }
  }

  return false
}

export const maybeRedirectIfCharacterIdQuery = async (
  context: GetServerSidePropsContext,
): Promise<false|{redirect: Redirect}> => {
  const { query } = context
  const characterId = query.characterId ? query.characterId : false

  if (characterId) {
    const { res } = context

    if (res) {
      return {
        redirect: {
          destination: `/characters/${characterId}`,
          statusCode: 307,
        },
      }
    }
  }

  return false
}

export const maybeRedirectIfItemIdQuery = async (context: GetServerSidePropsContext,) => {
  return (
    (await maybeRedirectIfCreationIdQuery(context)) ||
    (await maybeRedirectIfCharacterIdQuery(context)) ||
    (await maybeRedirectIfConceptIdQuery(context)) || { props: {} }
  )
}
