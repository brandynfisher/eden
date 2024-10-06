import { CollectionV2, CreationV2, ModelV2, TaskV2 } from '@edenlabs/eden-sdk'

export type GenericDocumentType = {
  _id: string
}

export interface IEntity {
  _id: string
}

export type RowItem = CreationV2 | ModelV2 | TaskV2 | CollectionV2

export type PageData<PageType> = {
  pageParams: number[]
  pages: PageType[]
}

export interface IPage<ItemType = IEntity> {
  docs?: ItemType[]
}

export type GenericPageType = IPage<RowItem>
export const addDocIfNotExistInPage = <T extends GenericDocumentType>(
  docUpdate: T,
  updatedPages: IPage<T>[],
): IPage<T>[] => {
  if (!docUpdate._id || !Array.isArray(updatedPages)) {
    return updatedPages
  }
  const pageIndex = updatedPages.findIndex(
    page =>
      Array.isArray(page?.docs) &&
      page.docs.some(doc => doc._id === docUpdate._id),
  )

  if (pageIndex === -1) {
    return [
      {
        ...(updatedPages[0] || {}),
        docs: [
          docUpdate,
          ...(Array.isArray(updatedPages[0]?.docs) ? updatedPages[0].docs : []),
        ],
      },
      ...updatedPages.slice(1),
    ]
  }
  return updatedPages
}

export const updateDocInPage = <T extends GenericDocumentType>(
  docUpdate: T,
  updatedPages: IPage<T>[],
): IPage<T>[] => {
  if (!docUpdate._id || !Array.isArray(updatedPages)) {
    return updatedPages
  }
  return updatedPages.map(page => {
    return {
      ...page,
      docs: Array.isArray(page?.docs)
        ? page.docs.map(doc => (doc._id === docUpdate._id ? docUpdate : doc))
        : undefined,
    }
  })
}
