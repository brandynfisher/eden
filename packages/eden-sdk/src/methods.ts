import { AxiosRequestConfig } from 'axios'

import { WebAPICallOptions, WebAPICallResult } from './EdenClient'
import {
  AdminAuthChallengeArguments,
  AdminAuthChallengeResponse,
  AdminMannaModifyArguments,
  AdminMannaModifyResponse,
  AdminMannaVouchersCreateArguments,
  AdminMannaVouchersCreateResponse,
  AdminMediaUploadArguments,
  AdminMediaUploadResponse,
  ApiKeysCreateArguments,
  ApiKeysCreateResponse,
  ApiKeysDeleteArguments,
  ApiKeysDeleteResponse,
  ApiKeysListArguments,
  ApiKeysListResponse,
  CharactersCreateArguments,
  CharactersCreateResponse,
  CharactersDeleteArguments,
  CharactersDeleteResponse,
  CharactersGetArguments,
  CharactersGetResponse,
  CharactersListArguments,
  CharactersListResponse,
  CharactersUpdateArguments,
  CharactersUpdateResponse,
  CollectionsAddCreationsArguments,
  CollectionsAddCreationsResponse,
  CollectionsCreateArguments,
  CollectionsCreateResponse,
  CollectionsDeleteArguments,
  CollectionsDeleteResponse,
  CollectionsGetArguments,
  CollectionsGetResponse,
  CollectionsListArguments,
  CollectionsListResponse,
  CollectionsRemoveCreationsArguments,
  CollectionsRemoveCreationsResponse,
  CollectionsUpdateArguments,
  CollectionsUpdateResponse,
  ConceptsDeleteArguments,
  ConceptsDeleteResponse,
  ConceptsGetArguments,
  ConceptsGetResponse,
  ConceptsListArguments,
  ConceptsListResponse,
  ConceptsReactArguments,
  ConceptsReactResponse,
  ConceptsUnreactArguments,
  ConceptsUnreactResponse,
  ConceptsUpdateArguments,
  ConceptsUpdateResponse,
  CreationsDeleteArguments,
  CreationsDeleteResponse,
  CreationsGetArguments,
  CreationsGetResponse,
  CreationsGetSimilarArguments,
  CreationsGetSimilarResponse,
  CreationsListArguments,
  CreationsListResponse,
  CreationsReactArguments,
  CreationsReactResponse,
  CreationsUnreactArguments,
  CreationsUnreactResponse,
  CreationsUpdateArguments,
  CreationsUpdateResponse,
  CreatorFollowersListArguments,
  CreatorFollowersListResponse,
  CreatorFollowingListResponse,
  CreatorsFollowArguments,
  CreatorsFollowResponse,
  CreatorsGetArguments,
  CreatorsGetMeResponse,
  CreatorsGetResponse,
  CreatorsListArguments,
  CreatorsListResponse,
  CreatorsUnfollowArguments,
  CreatorsUnfollowResponse,
  CreatorsUpdateArguments,
  CreatorsUpdateResponse,
  FeedConceptsArguments,
  FeedConceptsResponse,
  FeedCreationsArguments,
  FeedCreationsResponse,
  GeneratorsGetArguments,
  GeneratorsGetResponse,
  GeneratorsListArguments,
  GeneratorsListResponse,
  MannaBalanceGetArguments,
  MannaBalanceGetResponse,
  MannaVoucherRedeemResponse,
  MannaVouchersRedeemArguments,
  MediaUploadArguments,
  MediaUploadResponse,
  PaymentsCreateArguments,
  PaymentsCreateResponse,
  PaymentsProductsResponse,
  PaymentsSubscriptionArguments,
  PaymentsSubscriptionResponse,
  ScenariosCreateArguments,
  ScenariosCreateResponse,
  ScenariosDeleteArguments,
  ScenariosDeleteResponse,
  ScenariosGetArguments,
  ScenariosGetResponse,
  ScenariosListArguments,
  ScenariosListResponse,
  ScenariosUpdateArguments,
  ScenariosUpdateResponse,
  SessionEventsListArguments,
  SessionEventsListResponse,
  SessionsCreateArguments,
  SessionsCreateResponse,
  SessionsDeleteArguments,
  SessionsDeleteResponse,
  SessionsGetArguments,
  SessionsGetResponse,
  SessionsInteractArguments,
  SessionsInteractResponse,
  SessionsListArguments,
  SessionsListResponse,
  SessionsUpdateArguments,
  SessionsUpdateResponse,
  TasksChatCompleteArguments,
  TasksCompleteArguments,
  TasksCompleteResponse,
  TasksCreateArguments,
  TasksCreateResponse,
  TasksGetArguments,
  TasksGetResponse,
  TasksListArguments,
  TasksListResponse,
  adminAuthChallengeRequestConfig,
  adminMannaModifyRequestConfig,
  adminMannaVouchersCreateRequestConfig,
  adminMediaUploadRequestConfig,
  apiKeysCreateRequestConfig,
  apiKeysDeleteRequestConfig,
  apiKeysListRequestConfig,
  charactersCreateRequestConfig,
  charactersDeleteRequestConfig,
  charactersGetRequestConfig,
  charactersListRequestConfig,
  charactersUpdateRequestConfig,
  collectionsAddCreationsRequestConfig,
  collectionsCreateRequestConfig,
  collectionsDeleteRequestConfig,
  collectionsGetRequestConfig,
  collectionsListRequestConfig,
  collectionsRemoveCreationsRequestConfig,
  collectionsUpdateRequestConfig,
  conceptsDeleteRequestConfig,
  conceptsGetRequestConfig,
  conceptsListRequestConfig,
  conceptsReactRequestConfig,
  conceptsUnreactRequestConfig,
  conceptsUpdateRequestConfig,
  creationsDeleteRequestConfig,
  creationsGetRequestConfig,
  creationsGetSimilarRequestConfig,
  creationsListRequestConfig,
  creationsReactRequestConfig,
  creationsUnreactRequestConfig,
  creationsUpdateRequestConfig,
  creatorFollowersListRequestConfig,
  creatorFollowingListRequestConfig,
  creatorsFollowRequestConfig,
  creatorsGetMeRequestConfig,
  creatorsGetRequestConfig,
  creatorsListRequestConfig,
  creatorsUnfollowRequestConfig,
  creatorsUpdateRequestConfig,
  feedConceptsRequestConfig,
  feedCreationsRequestConfig,
  generatorsGetRequestConfig,
  generatorsListRequestConfig,
  mannaBalanceGetRequestConfig,
  mannaVouchersRedeemRequestConfig,
  mediaUploadRequestConfig,
  paymentsCreateRequestConfig,
  paymentsProductsRequestConfig,
  paymentsSubscriptionRequestConfig,
  scenariosCreateRequestConfig,
  scenariosDeleteRequestConfig,
  scenariosGetRequestConfig,
  scenariosListRequestConfig,
  scenariosUpdateRequestConfig,
  sessionEventsListRequestConfig,
  sessionsCreateRequestConfig,
  sessionsDeleteRequestConfig,
  sessionsGetRequestConfig,
  sessionsInteractRequestConfig,
  sessionsListRequestConfig,
  sessionsUpdateRequestConfig,
  tasksChatCompleteRequestConfig,
  tasksCompleteRequestConfig,
  tasksCostRequestConfig,
  tasksCreateRequestConfig,
  tasksGetRequestConfig,
  tasksListRequestConfig,
} from './models'

export const transformArgsIntoURLParams = (
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

  public readonly admin = {
    manna: {
      modify: bindApiCall<AdminMannaModifyArguments, AdminMannaModifyResponse>(
        this,
        adminMannaModifyRequestConfig,
      ),
      vouchers: {
        create: bindApiCall<
          AdminMannaVouchersCreateArguments,
          AdminMannaVouchersCreateResponse
        >(this, adminMannaVouchersCreateRequestConfig),
      },
    },
    auth: {
      challenge: bindApiCall<
        AdminAuthChallengeArguments,
        AdminAuthChallengeResponse
      >(this, adminAuthChallengeRequestConfig),
    },
    media: {
      upload: bindApiCall<AdminMediaUploadArguments, AdminMediaUploadResponse>(
        this,
        adminMediaUploadRequestConfig,
      ),
    },
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

  public readonly concepts = {
    list: bindApiCall<ConceptsListArguments, ConceptsListResponse>(
      this,
      conceptsListRequestConfig,
    ),
    get: bindApiCall<ConceptsGetArguments, ConceptsGetResponse>(
      this,
      conceptsGetRequestConfig,
    ),
    update: bindApiCall<ConceptsUpdateArguments, ConceptsUpdateResponse>(
      this,
      conceptsUpdateRequestConfig,
    ),
    delete: bindApiCall<ConceptsDeleteArguments, ConceptsDeleteResponse>(
      this,
      conceptsDeleteRequestConfig,
    ),
    react: bindApiCall<ConceptsReactArguments, ConceptsReactResponse>(
      this,
      conceptsReactRequestConfig,
    ),
    unreact: bindApiCall<ConceptsUnreactArguments, ConceptsUnreactResponse>(
      this,
      conceptsUnreactRequestConfig,
    ),
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
    update: bindApiCall<CreationsUpdateArguments, CreationsUpdateResponse>(
      this,
      creationsUpdateRequestConfig,
    ),
    delete: bindApiCall<CreationsDeleteArguments, CreationsDeleteResponse>(
      this,
      creationsDeleteRequestConfig,
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
    me: bindApiCall<WebAPICallOptions, CreatorsGetMeResponse>(
      this,
      creatorsGetMeRequestConfig,
    ),
  }

  public readonly creator = {
    followers: bindApiCall<
      CreatorFollowersListArguments,
      CreatorFollowersListResponse
    >(this, creatorFollowersListRequestConfig),

    following: bindApiCall<
      CreatorFollowersListArguments,
      CreatorFollowingListResponse
    >(this, creatorFollowingListRequestConfig),
  }

  public readonly feed = {
    creations: bindApiCall<FeedCreationsArguments, FeedCreationsResponse>(
      this,
      feedCreationsRequestConfig,
    ),
    concepts: bindApiCall<FeedConceptsArguments, FeedConceptsResponse>(
      this,
      feedConceptsRequestConfig,
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
    products: bindApiCall<WebAPICallOptions, PaymentsProductsResponse>(
      this,
      paymentsProductsRequestConfig,
    ),
    subscription: bindApiCall<
      PaymentsSubscriptionArguments,
      PaymentsSubscriptionResponse
    >(this, paymentsSubscriptionRequestConfig),
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
    interact: bindApiCall<SessionsInteractArguments, SessionsInteractResponse>(
      this,
      sessionsInteractRequestConfig,
    ),
  }

  public readonly session = {
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
    cost: bindApiCall<TasksCreateArguments, TasksCreateResponse>(
      this,
      tasksCostRequestConfig,
    ),
    complete: bindApiCall<TasksCompleteArguments, TasksCompleteResponse>(
      this,
      tasksCompleteRequestConfig,
    ),
    chat: bindApiCall<TasksChatCompleteArguments, TasksCompleteResponse>(
      this,
      tasksChatCompleteRequestConfig,
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
