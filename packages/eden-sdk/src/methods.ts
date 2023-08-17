import { AxiosRequestConfig } from 'axios'
import {
  SessionEventsListResponse,
  SessionsCreateResponse,
  SessionsDeleteResponse,
  SessionsGetResponse,
  SessionsListResponse,
  SessionsUpdateResponse,
} from 'src/responses'
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
import { PaymentsCreateResponse } from 'src/responses/PaymentsResponses'

import { WebAPICallOptions, WebAPICallResult } from './EdenClient'
import {
  ApiKeysCreateResponse,
  ApiKeysDeleteResponse,
  ApiKeysListResponse,
} from './responses/ApiKeysResponses'
import { AuthLoginResponse } from './responses/AuthResponses'
import {
  CharactersCreateResponse,
  CharactersDeleteResponse,
  CharactersGetResponse,
  CharactersListResponse,
  CharactersUpdateResponse,
} from './responses/CharactersResponses'
import {
  CreationsGetResponse,
  CreationsGetSimilarResponse,
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
  TasksCompleteResponse,
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
    getSimilar: bindApiCall<
      CreationsGetSimilarArguments,
      CreationsGetSimilarResponse
    >(this, creationsGetSimilarRequestConfig),
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

  public readonly payments = {
    create: bindApiCall<PaymentsCreateArguments, PaymentsCreateResponse>(
      this,
      paymentsCreateRequestConfig,
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

  public readonly sessions = {
    create: bindApiCall<SessionsCreateArguments, SessionsCreateResponse>(
      this,
      sessionsCreateRequestConfig,
    ),
    update: bindApiCall<SessionsUpdateArguments, SessionsUpdateResponse>(
      this,
      sessionsUpdateRequestConfig,
    ),
    delete: bindApiCall<SessionsDeleteArguments, SessionsDeleteResponse>(
      this,
      sessionsDeleteRequestConfig,
    ),
    list: bindApiCall<SessionsListArguments, SessionsListResponse>(
      this,
      sessionsListRequestConfig,
    ),
    get: bindApiCall<SessionsGetArguments, SessionsGetResponse>(
      this,
      sessionsGetRequestConfig,
    ),
    events: {
      list: bindApiCall<SessionEventsListArguments, SessionEventsListResponse>(
        this,
        sessionEventsListRequestConfig,
      ),
    },
  }

  public readonly tasks = {
    create: bindApiCall<TasksCreateArguments, TasksCreateResponse>(
      this,
      tasksCreateRequestConfig,
    ),
    complete: bindApiCall<TasksCompleteArguments, TasksCompleteResponse>(
      this,
      tasksCompleteRequestConfig,
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
  image?: string
  description?: string
  greeting?: string
  dialogue?: string
}

export interface CharactersUpdateArguments extends WebAPICallOptions {
  characterId: string
  name?: string
  image?: string
  description?: string
  greeting?: string
  dialogue?: string
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

export interface CreationsGetSimilarArguments extends WebAPICallOptions {
  creationId: string
  n: number
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
  userImage?: string
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

export interface PaymentsCreateArguments extends WebAPICallOptions {
  priceId: string
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

export interface SessionsCreateArguments extends WebAPICallOptions {
  type: ScenarioType
}

export interface SessionsUpdateArguments extends WebAPICallOptions {
  sessionId: string
  data?: any
}

export interface SessionsDeleteArguments extends WebAPICallOptions {
  sessionId: string
}

export interface SessionsListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
}

export interface SessionsGetArguments extends WebAPICallOptions {
  sessionId: string
}

export interface SessionEventsListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  sessionId: string
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

export interface TasksCompleteArguments extends WebAPICallOptions {
  prompt: string
  config?: any
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

const creationsGetSimilarRequestConfig = (
  args: CreationsGetSimilarArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `creations/${args.creationId}/similar`,
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

const paymentsCreateRequestConfig = (
  args: PaymentsCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'payments/create',
    data: {
      ...args,
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

const sessionsCreateRequestConfig = (
  args: SessionsCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'sessions/create',
    data: {
      ...args,
    },
  }
}

const sessionsUpdateRequestConfig = (
  args: SessionsUpdateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'sessions/update',
    data: {
      ...args,
    },
  }
}

const sessionsDeleteRequestConfig = (
  args: SessionsDeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'sessions/delete',
    data: {
      ...args,
    },
  }
}

const sessionsListRequestConfig = (
  args: SessionsListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'sessions',
    params,
  }
}

const sessionsGetRequestConfig = (
  args: SessionsGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `sessions/${args.sessionId}`,
  }
}

const sessionEventsListRequestConfig = (
  args: SessionEventsListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: `sessions/${args.sessionId}/events`,
    params,
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

const tasksCompleteRequestConfig = (
  args: TasksCompleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'tasks/complete',
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
