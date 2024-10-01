// Arguments
import { ListQueryParams, WebAPICallOptions } from 'src/types'

export interface CollectionsV2ListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string
  creationId?: string
}
