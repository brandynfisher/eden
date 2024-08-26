import { CreationV2, ModelV2, TaskV2 } from '@edenlabs/eden-sdk'

export type GenericDocumentType = {
  _id: string
}

export interface IEntity {
  _id: string
}

export type RowItem = CreationV2 | ModelV2 | TaskV2

export type PageData<PageType> = {
  pageParams: number[]
  pages: PageType[]
}

export interface IPage<ItemType = IEntity> {
  docs?: ItemType[]
}

export type GenericPageType = IPage<RowItem>

export const addDocIfNotExistInPage = <T>(
  docUpdate: T,
  updatedPages: IPage<T>[],
): IPage<T>[] => {
  const pageIndex = updatedPages.findIndex(page =>
    page?.docs?.some(
      doc =>
        (doc as GenericDocumentType)._id ===
        (docUpdate as GenericDocumentType)._id,
    ),
  )
  if (pageIndex === -1) {
    return [
      {
        ...updatedPages[0],
        docs: [docUpdate, ...(updatedPages[0]?.docs || [])],
      },
      ...updatedPages.slice(1),
    ]
  }
  return updatedPages
}

export const updateDocInPage = <T>(
  docUpdate: T,
  updatedPages: IPage<T>[],
): IPage<T>[] => {
  return updatedPages.map(page => {
    return {
      ...page,
      docs: page?.docs?.map(doc =>
        (doc as GenericDocumentType)._id ===
        (docUpdate as GenericDocumentType)._id
          ? docUpdate
          : doc,
      ),
    }
  })
}
