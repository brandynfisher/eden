import { NextRouter } from 'next/router'

interface ISpecialRouteIndex<TValue> {
  [id: string]: TValue
}

const specialHandlingRoutes: ISpecialRouteIndex<{ basePath: string }> = {
  '/creators/[id]': {
    basePath: 'creators',
  },
  '/collections/[id]': {
    basePath: 'collections',
  },
}
export const getModalUrls = (
  router: NextRouter,
  creationId: string,
): { pageUrl: string; modalUrl: string } => {
  const urls = {
    pageUrl: '',
    modalUrl: '',
  }

  // all default cases
  if (!specialHandlingRoutes[router.pathname]) {
    urls.modalUrl = `/creations/${creationId}`
    return urls
  }

  // special workaround when we're trying to open modals on routes with dynamic parameters
  const basePath = specialHandlingRoutes[router.pathname].basePath
  urls.modalUrl = `/${basePath}/${router.query.id}?creationId=${creationId}`
  urls.pageUrl = urls.modalUrl

  return urls
}
