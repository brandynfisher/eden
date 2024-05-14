// import { Page } from '@/../types/page'
// import { ConceptHeadTags } from '@/components/HeadTags'
import ConceptPage from '@/components/Pages/ConceptPage'
// import { getAuthHeaders } from '@/lib/auth'
// import { CONFIG } from '@/lib/config'
// import { fetcher as fetcherFn } from '@/lib/fetcher'
// import { getServerSidePropsBase } from '@/lib/ssr'
// import { Concept as ConceptType } from '@edenlabs/eden-sdk'
// import { NextApiRequest, NextPageContext } from 'next'
import Error from 'next/error'
import React, { useEffect, useState } from 'react'
import { NextPageContext } from 'next'
import { maybeRedirectIfItemIdQuery } from '@/lib/redirect'
import { useRouter } from 'next/router'

// interface PageProps {
//   data: { concept: ConceptType }
//   error?: string
// }

// const fetchConcept = async (context: NextPageContext) => {
//   const { req, query } = context
//   const id = query.id ? String(query.id).trim() : false
//
//   console.log('conceptPage fetchConcept', id, { process: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, config: CONFIG.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME })
//
//   return fetcherFn(`${CONFIG.NEXT_PUBLIC_HOST}/api/concepts/${id}`, {
//     headers: await getAuthHeaders(req as NextApiRequest),
//   })
// }

// export const getServerSideProps = getServerSidePropsBase([
//   {
//     responseFieldName: 'concept',
//     dataFetcher: fetchConcept,
//   },
// ])

// const Concept: Page<PageProps> = ({ data }: PageProps) => {
//   if (!data) {
//     return <Error statusCode={404} withDarkMode={true} />
//   }
//
//   console.log('conceptPage index', { process: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, config: CONFIG.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME })
//   console.log({data})
//
//   return (
//     <>
//       <ConceptHeadTags concept={data.concept} />
//       <ConceptPage data={data} />
//     </>
//   )
// }

export async function getServerSideProps(ctx: NextPageContext) {
  return maybeRedirectIfItemIdQuery(ctx)
}

const Concept = () => {
  // console.log(context)
  // const { query } = context
  // console.log(query)
  // const id = query.id ? String(query.id).trim() : false
  //
  // console.log('conceptPage index', {id, process: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, config: CONFIG.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME })
  // // console.log({data})

  const [ conceptId, setConceptId ] = useState<string>()
  const router = useRouter()
  useEffect(() => {
    if (router.query && router.query.id) {
      setConceptId(router.query.id.toString())
    }
  }, [router])

  if (!conceptId) {
    return (<Error statusCode={404} withDarkMode={true} />)
  }

  return (
    <>
      {/*<ConceptHeadTags concept={data.concept} />*/}
      <ConceptPage conceptId={conceptId} />
    </>
  )
}


export default Concept
