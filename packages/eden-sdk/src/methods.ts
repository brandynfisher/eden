import { AxiosRequestConfig } from 'axios'
import {
  CollectionsAddCreationsResponse,
  CollectionsCreateResponse,
  CollectionsDeleteResponse,
  CollectionsGetResponse,
  CollectionsListResponse,
  CollectionsRemoveCreationsResponse,
  CollectionsUpdateResponse,
} from 'src/responses/CollectionsResponses'
import { MediaUploadResponse } from 'src/responses/MediaResponses'

import { WebAPICallOptions, WebAPICallResult } from './EdenClient'
import {
  ApiKeysCreateResponse,
  ApiKeysDeleteResponse,
  ApiKeysListResponse,
} from './responses/ApiKeysResponses'
import { AuthLoginResponse } from './responses/AuthResponses'
import {
  CapabilitiesCreateResponse,
  CapabilitiesDeleteResponse,
  CapabilitiesGetResponse,
  CapabilitiesListResponse,
  CapabilitiesUpdateResponse,
  CapabilityType,
} from './responses/CapabilitiesResponses'
import {
  CharactersCreateResponse,
  CharactersDeleteResponse,
  CharactersGetResponse,
  CharactersListResponse,
  CharactersUpdateResponse,
} from './responses/CharactersResponses'
import {
  CreationsGetResponse,
  CreationsListResponse,
  CreationsReactResponse,
  CreationsUnreactResponse,
  ReactionType,
} from './responses/CreationsResponses'
import {
  CreatorsFollowResponse,
  CreatorsGetResponse,
  CreatorsListResponse,
  CreatorsUnfollowResponse,
  CreatorsUpdateResponse,
} from './responses/CreatorsResponses'
import {
  GeneratorsGetResponse,
  GeneratorsListResponse,
} from './responses/GeneratorsResponses'
import {
  MannaBalanceGetResponse,
  MannaVoucherRedeemResponse,
} from './responses/MannaResponses'
import {
  ScenarioType,
  ScenariosCreateResponse,
  ScenariosDeleteResponse,
  ScenariosGetResponse,
  ScenariosListResponse,
  ScenariosUpdateResponse,
} from './responses/ScenariosResponses'
import {
  TasksCreateResponse,
  TasksGetResponse,
  TasksListResponse,
} from './responses/TasksResponses'

const transformArgsIntoURLParams = (
  args: Record<string, any>,
): URLSearchParams => {
  const params = new URLSearchParams()

  for (const key in args) {
    if (Object.prototype.hasOwnProperty.call(args, key)) {
      const value = args[key]
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => params.append(key, item))
        } else {
          params.append(key, value.toString())
        }
      }
    }
  }

  return params
}

interface ListQueryParams {
  page?: number
  limit?: number
  sort?: object
}

export default interface Method<
  MethodArguments extends WebAPICallOptions,
  MethodResult extends WebAPICallResult = WebAPICallResult,
> {
  (options?: MethodArguments): Promise<MethodResult>
}

function bindApiCall<
  Arguments extends WebAPICallOptions,
  Result extends WebAPICallResult,
>(
  self: Methods,
  configFn: (options) => AxiosRequestConfig,
): Method<Arguments, Result> {
  // We have to "assert" that the bound method does indeed return the more specific `Result` type instead of just
  // `WebAPICallResult`
  return self.apiCall.bind(self, configFn) as Method<Arguments, Result>
}

export abstract class Methods {
  public abstract apiCall(
    configFn: (options: WebAPICallOptions) => AxiosRequestConfig,
    options?: WebAPICallOptions,
  ): Promise<WebAPICallResult>

  public readonly characters = {
    create: bindApiCall<CharactersCreateArguments, CharactersCreateResponse>(
      this,
      charactersCreateRequestConfig,
    ),
    update: bindApiCall<CharactersUpdateArguments, CharactersUpdateResponse>(
      this,
      charactersUpdateRequestConfig,
    ),
    delete: bindApiCall<CharactersDeleteArguments, CharactersDeleteResponse>(
      this,
      charactersDeleteRequestConfig,
    ),
    list: bindApiCall<CharactersListArguments, CharactersListResponse>(
      this,
      charactersListRequestConfig,
    ),
    get: bindApiCall<CharactersGetArguments, CharactersGetResponse>(
      this,
      charactersGetRequestConfig,
    ),
  }

  public readonly apiKeys = {
    list: bindApiCall<ApiKeysListArguments, ApiKeysListResponse>(
      this,
      apiKeysListRequestConfig,
    ),
    create: bindApiCall<ApiKeysCreateArguments, ApiKeysCreateResponse>(
      this,
      apiKeysCreateRequestConfig,
    ),
    delete: bindApiCall<ApiKeysDeleteArguments, ApiKeysDeleteResponse>(
      this,
      apiKeysDeleteRequestConfig,
    ),
  }

  public readonly auth = {
    login: bindApiCall<AuthLoginArguments, AuthLoginResponse>(
      this,
      authLoginRequestConfig,
    ),
  }

  public readonly capabilities = {
    create: bindApiCall<
      CapabilitiesCreateArguments,
      CapabilitiesCreateResponse
    >(this, capabilitiesCreateRequestConfig),
    update: bindApiCall<
      CapabilitiesUpdateArguments,
      CapabilitiesUpdateResponse
    >(this, capabilitiesUpdateRequestConfig),
    delete: bindApiCall<
      CapabilitiesDeleteArguments,
      CapabilitiesDeleteResponse
    >(this, capabilitiesDeleteRequestConfig),
    list: bindApiCall<CapabilitiesListArguments, CapabilitiesListResponse>(
      this,
      capabilitiesListRequestConfig,
    ),
    get: bindApiCall<CapabilitiesGetArguments, CapabilitiesGetResponse>(
      this,
      capabilitiesGetRequestConfig,
    ),
  }

  public readonly collections = {
    list: bindApiCall<CollectionsListArguments, CollectionsListResponse>(
      this,
      collectionsListRequestConfig,
    ),
    get: bindApiCall<CollectionsGetArguments, CollectionsGetResponse>(
      this,
      collectionsGetRequestConfig,
    ),
    create: bindApiCall<CollectionsCreateArguments, CollectionsCreateResponse>(
      this,
      collectionsCreateRequestConfig,
    ),
    update: bindApiCall<CollectionsUpdateArguments, CollectionsUpdateResponse>(
      this,
      collectionsUpdateRequestConfig,
    ),
    delete: bindApiCall<CollectionsDeleteArguments, CollectionsDeleteResponse>(
      this,
      collectionsDeleteRequestConfig,
    ),
    creations: {
      add: bindApiCall<
        CollectionsAddCreationsArguments,
        CollectionsAddCreationsResponse
      >(this, collectionsAddCreationsRequestConfig),
      remove: bindApiCall<
        CollectionsRemoveCreationsArguments,
        CollectionsRemoveCreationsResponse
      >(this, collectionsRemoveCreationsRequestConfig),
    },
  }

  public readonly creations = {
    list: bindApiCall<CreationsListArguments, CreationsListResponse>(
      this,
      creationsListRequestConfig,
    ),
    get: bindApiCall<CreationsGetArguments, CreationsGetResponse>(
      this,
      creationsGetRequestConfig,
    ),
    react: bindApiCall<CreationsReactArguments, CreationsReactResponse>(
      this,
      creationsReactRequestConfig,
    ),
    unreact: bindApiCall<CreationsUnreactArguments, CreationsUnreactResponse>(
      this,
      creationsUnreactRequestConfig,
    ),
  }

  public readonly creators = {
    follow: bindApiCall<CreatorsFollowArguments, CreatorsFollowResponse>(
      this,
      creatorsFollowRequestConfig,
    ),
    unfollow: bindApiCall<CreatorsUnfollowArguments, CreatorsUnfollowResponse>(
      this,
      creatorsUnfollowRequestConfig,
    ),
    list: bindApiCall<CreatorsListArguments, CreatorsListResponse>(
      this,
      creatorsListRequestConfig,
    ),
    get: bindApiCall<CreatorsGetArguments, CreatorsGetResponse>(
      this,
      creatorsGetRequestConfig,
    ),
    update: bindApiCall<CreatorsUpdateArguments, CreatorsUpdateResponse>(
      this,
      creatorsUpdateRequestConfig,
    ),
  }

  public readonly generators = {
    list: bindApiCall<GeneratorsListArguments, GeneratorsListResponse>(
      this,
      generatorsListRequestConfig,
    ),
    get: bindApiCall<GeneratorsGetArguments, GeneratorsGetResponse>(
      this,
      generatorsGetRequestConfig,
    ),
  }

  public readonly manna = {
    balance: bindApiCall<MannaBalanceGetArguments, MannaBalanceGetResponse>(
      this,
      mannaBalanceGetRequestConfig,
    ),
    vouchers: {
      redeem: bindApiCall<
        MannaVouchersRedeemArguments,
        MannaVoucherRedeemResponse
      >(this, mannaVouchersRedeemRequestConfig),
    },
  }

  public readonly media = {
    upload: bindApiCall<MediaUploadArguments, MediaUploadResponse>(
      this,
      mediaUploadRequestConfig,
    ),
  }

  public readonly scenarios = {
    create: bindApiCall<ScenariosCreateArguments, ScenariosCreateResponse>(
      this,
      scenariosCreateRequestConfig,
    ),
    update: bindApiCall<ScenariosUpdateArguments, ScenariosUpdateResponse>(
      this,
      scenariosUpdateRequestConfig,
    ),
    delete: bindApiCall<ScenariosDeleteArguments, ScenariosDeleteResponse>(
      this,
      scenariosDeleteRequestConfig,
    ),
    list: bindApiCall<ScenariosListArguments, ScenariosListResponse>(
      this,
      scenariosListRequestConfig,
    ),
    get: bindApiCall<ScenariosGetArguments, ScenariosGetResponse>(
      this,
      scenariosGetRequestConfig,
    ),
  }

  public readonly tasks = {
    create: bindApiCall<TasksCreateArguments, TasksCreateResponse>(
      this,
      tasksCreateRequestConfig,
    ),
    get: bindApiCall<TasksGetArguments, TasksGetResponse>(
      this,
      tasksGetRequestConfig,
    ),
    list: bindApiCall<TasksListArguments, TasksListResponse>(
      this,
      tasksListRequestConfig,
    ),
  }
}

export interface CharactersListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
}

export interface CharactersGetArguments extends WebAPICallOptions {
  characterId: string
}

export interface CharactersCreateArguments extends WebAPICallOptions {
  name: string
}

export interface CharactersUpdateArguments extends WebAPICallOptions {
  characterId: string
  name: string
}

export interface CharactersDeleteArguments extends WebAPICallOptions {
  characterId: string
}

export type ApiKeysListArguments = WebAPICallOptions & ListQueryParams

export interface ApiKeysCreateArguments extends WebAPICallOptions {
  note?: string
}

export interface ApiKeysDeleteArguments extends WebAPICallOptions {
  apiKey: string
}

export interface AuthLoginArguments extends WebAPICallOptions {
  address: string
  message: string
  signature: string
}

export interface AuthCreateChallengeArguments extends WebAPICallOptions {
  address: string
  isWeb2: boolean
}

export interface CapabilitiesCreateArguments extends WebAPICallOptions {
  characterId: string
  name: string
  type: CapabilityType
  data: any
}

export interface CapabilitiesUpdateArguments extends WebAPICallOptions {
  capabilityId: string
  name?: string
  data?: any
}

export interface CapabilitiesDeleteArguments extends WebAPICallOptions {
  capabilityId: string
}

export interface CapabilitiesListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  characterId: string | string[]
}

export interface CapabilitiesGetArguments extends WebAPICallOptions {
  capabilityId: string
}

export interface CollectionsCreateArguments extends WebAPICallOptions {
  name: string
  description?: string
  creationIds?: string[]
}

export interface CollectionsUpdateArguments extends WebAPICallOptions {
  collectionId: string
  name?: string
  description?: string
}

export interface CollectionsDeleteArguments extends WebAPICallOptions {
  collectionId: string
}

export interface CollectionsAddCreationsArguments extends WebAPICallOptions {
  collectionId: string
  creationIds: string[]
}

export interface CollectionsRemoveCreationsArguments extends WebAPICallOptions {
  collectionId: string
  creationIds: string[]
}

export interface CollectionsListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
}

export interface CollectionsGetArguments extends WebAPICallOptions {
  collectionId: string
}

export interface CreationsListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
}

export interface CreationsGetArguments extends WebAPICallOptions {
  creationId: string
}

export interface CreationsReactArguments extends WebAPICallOptions {
  creationId: string
  reaction: ReactionType
}

export interface CreationsUnreactArguments extends WebAPICallOptions {
  creationId: string
  reaction: ReactionType
}

export interface CreatorsFollowArguments extends WebAPICallOptions {
  userId: string
}

export interface CreatorsUnfollowArguments extends WebAPICallOptions {
  userId: string
}

export interface CreatorsListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
}

export interface CreatorsGetArguments extends WebAPICallOptions {
  userId: string
}

export interface CreatorsUpdateArguments extends WebAPICallOptions {
  username?: string
}

export type GeneratorsListArguments = WebAPICallOptions & ListQueryParams

export interface GeneratorsGetArguments extends WebAPICallOptions {
  generatorName: string
}

export type MannaBalanceGetArguments = WebAPICallOptions

export interface MannaVouchersRedeemArguments extends WebAPICallOptions {
  code: string
}

export interface MediaUploadArguments extends WebAPICallOptions {
  media: Buffer
}

export interface ScenariosCreateArguments extends WebAPICallOptions {
  name: string
  description: string
  type: ScenarioType
  data: any
}

export interface ScenariosUpdateArguments extends WebAPICallOptions {
  scenarioId: string
  name?: string
  description?: string
  data?: any
}

export interface ScenariosDeleteArguments extends WebAPICallOptions {
  scenarioId: string
}

export interface ScenariosListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
}

export interface ScenariosGetArguments extends WebAPICallOptions {
  scenarioId: string
}

export interface TasksCreateArguments extends WebAPICallOptions {
  generatorName: string
  versionId?: string
  config?: any
  metadata?: any
  webhooks?: string[]
}

export interface TasksListArguments extends WebAPICallOptions, ListQueryParams {
  status?: string | string[]
  taskId?: string | string[]
}

export interface TasksGetArguments extends WebAPICallOptions {
  taskId: string
}

const charactersListRequestConfig = (
  args: CharactersListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams({
    ...args,
  })
  return {
    method: 'GET',
    url: 'characters',
    params,
  }
}

const charactersGetRequestConfig = (
  args: CharactersGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `characters/${args.characterId}`,
  }
}

const charactersCreateRequestConfig = (
  args: CharactersCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'characters/create',
    data: {
      ...args,
    },
  }
}

const charactersUpdateRequestConfig = (
  args: CharactersUpdateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'characters/update',
    data: {
      ...args,
    },
  }
}

const charactersDeleteRequestConfig = (
  args: CharactersDeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'characters/delete',
    data: {
      ...args,
    },
  }
}

const apiKeysListRequestConfig = (
  args: ApiKeysListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams({
    ...args,
  })
  return {
    method: 'GET',
    url: 'apikeys',
    params,
  }
}

const apiKeysCreateRequestConfig = (
  args: ApiKeysCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'apikeys/create',
    data: {
      note: args.note,
    },
  }
}

const apiKeysDeleteRequestConfig = (
  args: ApiKeysDeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'apikeys/delete',
    data: {
      ...args,
    },
  }
}

const authLoginRequestConfig = (
  args: AuthLoginArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'auth/login',
    data: {
      ...args,
    },
  }
}

const capabilitiesCreateRequestConfig = (
  args: CapabilitiesCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'capabilities/create',
    data: {
      ...args,
    },
  }
}

const capabilitiesUpdateRequestConfig = (
  args: CapabilitiesUpdateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'capabilities/update',
    data: {
      ...args,
    },
  }
}

const capabilitiesDeleteRequestConfig = (
  args: CapabilitiesDeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'capabilities/delete',
    data: {
      ...args,
    },
  }
}

const capabilitiesListRequestConfig = (
  args: CapabilitiesListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'capabilities',
    params,
  }
}

const capabilitiesGetRequestConfig = (
  args: CapabilitiesGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `capabilities/${args.capabilityId}`,
  }
}

const collectionsCreateRequestConfig = (
  args: CollectionsCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'collections/create',
    data: {
      ...args,
    },
  }
}

const collectionsUpdateRequestConfig = (
  args: CollectionsUpdateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'collections/update',
    data: {
      ...args,
    },
  }
}

const collectionsDeleteRequestConfig = (
  args: CollectionsDeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'collections/delete',
    data: {
      ...args,
    },
  }
}

const collectionsListRequestConfig = (
  args: CollectionsListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'collections',
    params,
  }
}

const collectionsGetRequestConfig = (
  args: CollectionsGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `collections/${args.collectionId}`,
  }
}

const collectionsAddCreationsRequestConfig = (
  args: CollectionsAddCreationsArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'collections/addcreations',
    data: {
      ...args,
    },
  }
}

const collectionsRemoveCreationsRequestConfig = (
  args: CollectionsRemoveCreationsArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'collections/removecreations',
    data: {
      ...args,
    },
  }
}

const creationsListRequestConfig = (
  args: CreationsListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'creations',
    params,
  }
}

const creationsGetRequestConfig = (
  args: CreationsGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `creations/${args.creationId}`,
  }
}

const creationsReactRequestConfig = (
  args: CreationsReactArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'creations/react',
    data: {
      ...args,
    },
  }
}

const creationsUnreactRequestConfig = (
  args: CreationsUnreactArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'creations/unreact',
    data: {
      ...args,
    },
  }
}

const creatorsFollowRequestConfig = (
  args: CreatorsFollowArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'creators/follow',
    data: {
      ...args,
    },
  }
}

const creatorsUnfollowRequestConfig = (
  args: CreatorsUnfollowArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'creators/unfollow',
    data: {
      ...args,
    },
  }
}

const creatorsListRequestConfig = (
  args: CreatorsListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'creators',
    params,
  }
}

const creatorsGetRequestConfig = (
  args: CreatorsGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `creators/${args.userId}`,
  }
}

const creatorsUpdateRequestConfig = (
  args: CreatorsUpdateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'creators/update',
    data: {
      ...args,
    },
  }
}

const generatorsListRequestConfig = (): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: 'generators',
  }
}

const generatorsGetRequestConfig = (
  args: GeneratorsGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `generators/${args.generatorName}`,
  }
}

const mannaBalanceGetRequestConfig = (): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: 'manna/balance',
  }
}

const mannaVouchersRedeemRequestConfig = (
  args: MannaVouchersRedeemArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'manna/vouchers/redeem',
    data: {
      ...args,
    },
  }
}

const mediaUploadRequestConfig = (args: MediaUploadArguments) => {
  const blob = new Blob([args.media])
  const form = new FormData()
  form.append('file', blob)
  return {
    method: 'POST',
    url: 'media/upload',
    data: form,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }
}

const scenariosCreateRequestConfig = (
  args: ScenariosCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'scenarios/create',
    data: {
      ...args,
    },
  }
}

const scenariosUpdateRequestConfig = (
  args: ScenariosUpdateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'scenarios/update',
    data: {
      ...args,
    },
  }
}

const scenariosDeleteRequestConfig = (
  args: ScenariosDeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'scenarios/delete',
    data: {
      ...args,
    },
  }
}

const scenariosListRequestConfig = (
  args: ScenariosListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'scenarios',
    params,
  }
}

const scenariosGetRequestConfig = (
  args: ScenariosGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `scenarios/${args.scenarioId}`,
  }
}

const tasksCreateRequestConfig = (
  args: TasksCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'tasks/create',
    data: {
      ...args,
    },
  }
}

const tasksListRequestConfig = (
  args: TasksListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'tasks',
    params,
  }
}

const tasksGetRequestConfig = (args: TasksGetArguments): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `tasks/${args.taskId}`,
  }
}
