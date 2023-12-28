import { CardData } from '@/components/Card/Card'
import { ItemType } from '@/providers/ModalProvider'
import { Creator } from '@edenlabs/eden-sdk'
import { NextRouter } from 'next/router'

interface ISpecialRouteIndex<TValue> {
  [id: string]: TValue
}

const specialHandlingRoutes: ISpecialRouteIndex<{ basePath: string }> = {
  '/characters/[id]': {
    basePath: 'characters',
  },
  '/creators/[id]': {
    basePath: 'creators',
  },
  '/collections/[id]': {
    basePath: 'collections',
  },
  '/concepts/[id]': {
    basePath: 'concepts',
  },
  '/create/creations': {
    basePath: 'create/creations',
  },
  '/create/characters': {
    basePath: 'create/characters',
  },
  '/create/concepts': {
    basePath: 'create/concepts',
  },
}

const getCreatorName = (item: Creator) => {
  return item.username || item.userId
}

const getItemId = (item: CardData) => {
  return item._id
}

export const getId = (itemType: ItemType, item: CardData | Creator) => {
  if (itemType === 'creator') {
    return getCreatorName(item as Creator)
  }

  return getItemId(item as CardData)
}

export const getModalUrls = (
  router: NextRouter,
  itemType: ItemType,
  item: CardData | Creator,
): { pageUrl: string; modalUrl: string } => {
  const id = getId(itemType, item)
  const urls = {
    pageUrl: '',
    modalUrl: '',
  }

  // all default cases; modalUrl has id as path segment instead of query param
  if (!specialHandlingRoutes[router.pathname]) {
    urls.modalUrl = `/${itemType}s/${id}`
    return urls
  }

  // special workaround: modalUrl has id as query param - when we're trying to open modals on routes with dynamic parameters
  const basePath = specialHandlingRoutes[router.pathname].basePath
  urls.modalUrl = `/${basePath}${
    router.query.id ? `/${router.query.id}` : ''
  }?${itemType}Id=${id}`
  urls.pageUrl = urls.modalUrl

  return urls
}
