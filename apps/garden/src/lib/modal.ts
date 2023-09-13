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
  itemType: 'creation' | 'concept',
  itemId: string,
): { pageUrl: string; modalUrl: string } => {
  const urls = {
    pageUrl: '',
    modalUrl: '',
  }

  // all default cases; modalUrl has id as path segment instead of query param
  if (!specialHandlingRoutes[router.pathname]) {
    urls.modalUrl = `/${itemType}s/${itemId}`
    return urls
  }

  // special workaround: modalUrl has id as query param - when we're trying to open modals on routes with dynamic parameters
  const basePath = specialHandlingRoutes[router.pathname].basePath
  urls.modalUrl = `/${basePath}/${router.query.id}?${itemType}Id=${itemId}`
  urls.pageUrl = urls.modalUrl

  return urls
}
