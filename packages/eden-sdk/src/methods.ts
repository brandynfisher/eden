import {
  AdminApiKeysListArguments,
  AdminApiKeysListResponse,
  AdminAuthChallengeArguments,
  AdminAuthChallengeResponse,
  AdminConceptsExportToHFArguments,
  AdminConceptsRemoveFromHFArguments,
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
  CharactersTestArguments,
  CharactersTestResponse,
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
  FeedCreationsCursorArguments,
  FeedCreationsCursorResponse,
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
  SessionEventsListArguments,
  SessionEventsListResponse,
  SessionsAddCharactersArguments,
  SessionsAddCharactersResponse,
  SessionsAddUsersArguments,
  SessionsAddUsersResponse,
  SessionsCreateResponse,
  SessionsDeleteArguments,
  SessionsDeleteResponse,
  SessionsGetArguments,
  SessionsGetResponse,
  SessionsInteractArguments,
  SessionsInteractResponse,
  SessionsListArguments,
  SessionsListResponse,
  TasksCreateArguments,
  TasksCreateResponse,
  TasksGetArguments,
  TasksGetResponse,
  TasksListArguments,
  TasksListResponse,
  adminApiKeysListRequestConfig,
  adminAuthChallengeRequestConfig,
  adminConceptsExportToHFRequestConfig,
  adminConceptsRemoveFromHFRequestConfig,
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
  charactersTestRequestConfig,
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
  feedCursorCreationsRequestConfig,
  generatorsGetRequestConfig,
  generatorsListRequestConfig,
  mannaBalanceGetRequestConfig,
  mannaVouchersRedeemRequestConfig,
  mediaUploadRequestConfig,
  paymentsCreateRequestConfig,
  paymentsProductsRequestConfig,
  paymentsSubscriptionRequestConfig,
  sessionEventsListRequestConfig,
  sessionsAddCharactersRequestConfig,
  sessionsAddUsersRequestConfig,
  sessionsCreateRequestConfig,
  sessionsDeleteRequestConfig,
  sessionsGetRequestConfig,
  sessionsInteractRequestConfig,
  sessionsListRequestConfig,
  tasksCostRequestConfig,
  tasksCreateRequestConfig,
  tasksGetRequestConfig,
  tasksListRequestConfig,
} from './models'
import {
  GeneratorsGetArgumentsV2,
  GeneratorsGetResponseV2,
  GeneratorsListArgumentsV2,
  GeneratorsListResponseV2,
  TasksV2CancelArguments,
  TasksV2CancelResponse,
  TasksV2CreateArguments,
  TasksV2CreateResponse,
  TasksV2GetArguments,
  TasksV2GetResponse,
  TasksV2ListArguments,
  TasksV2ListResponse,
  generatorsGetRequestConfigV2,
  generatorsListRequestConfigV2,
  tasksV2CancelRequestConfig,
  tasksV2CostRequestConfig,
  tasksV2CreateRequestConfig,
  tasksV2GetRequestConfig,
  tasksV2ListRequestConfig,
} from './models/v2'
import { WebAPICallOptions, WebAPICallResult } from './types'
import { AxiosRequestConfig } from 'axios'

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

// function bindApiCallAsync<
//   Arguments extends WebAPICallOptions,
//   Result extends WebAPICallResult,
// >(
//   self: Methods,
//   configFn: (args: MediaUploadArguments) => Promise<AxiosRequestConfig>,
// ): Method<Arguments, Result> {
//   // We have to "assert" that the bound method does indeed return the more specific `Result` type instead of just
//   // `WebAPICallResult`
//   return self.apiCall.bind(self, configFn) as Method<Arguments, Result>
// }

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
    concepts: {
      remove: {
        hf: bindApiCall<
          AdminConceptsRemoveFromHFArguments,
          AdminConceptsRemoveFromHFArguments
        >(this, adminConceptsRemoveFromHFRequestConfig),
      },
      export: {
        hf: bindApiCall<
          AdminConceptsExportToHFArguments,
          AdminConceptsExportToHFArguments
        >(this, adminConceptsExportToHFRequestConfig),
      },
    },
    apikeys: {
      list: bindApiCall<AdminApiKeysListArguments, AdminApiKeysListResponse>(
        this,
        adminApiKeysListRequestConfig,
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
    test: bindApiCall<CharactersTestArguments, CharactersTestResponse>(
      this,
      charactersTestRequestConfig,
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

  public readonly feed_cursor = {
    creations: bindApiCall<
      FeedCreationsCursorArguments,
      FeedCreationsCursorResponse
    >(this, feedCursorCreationsRequestConfig),
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
    listV2: bindApiCall<GeneratorsListArgumentsV2, GeneratorsListResponseV2>(
      this,
      generatorsListRequestConfigV2,
    ),
    getV2: bindApiCall<GeneratorsGetArgumentsV2, GeneratorsGetResponseV2>(
      this,
      generatorsGetRequestConfigV2,
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

  public readonly sessions = {
    create: bindApiCall<WebAPICallOptions, SessionsCreateResponse>(
      this,
      sessionsCreateRequestConfig,
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
    users: {
      add: bindApiCall<SessionsAddUsersArguments, SessionsAddUsersResponse>(
        this,
        sessionsAddUsersRequestConfig,
      ),
    },
    characters: {
      add: bindApiCall<
        SessionsAddCharactersArguments,
        SessionsAddCharactersResponse
      >(this, sessionsAddCharactersRequestConfig),
    },
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
    createV2: bindApiCall<TasksV2CreateArguments, TasksV2CreateResponse>(
      this,
      tasksV2CreateRequestConfig,
    ),
    cost: bindApiCall<TasksCreateArguments, TasksCreateResponse>(
      this,
      tasksCostRequestConfig,
    ),
    costV2: bindApiCall<TasksV2CreateArguments, TasksV2CreateResponse>(
      this,
      tasksV2CostRequestConfig,
    ),
    get: bindApiCall<TasksGetArguments, TasksGetResponse>(
      this,
      tasksGetRequestConfig,
    ),
    getV2: bindApiCall<TasksV2GetArguments, TasksV2GetResponse>(
      this,
      tasksV2GetRequestConfig,
    ),
    list: bindApiCall<TasksListArguments, TasksListResponse>(
      this,
      tasksListRequestConfig,
    ),
    listV2: bindApiCall<TasksV2ListArguments, TasksV2ListResponse>(
      this,
      tasksV2ListRequestConfig,
    ),
    cancelV2: bindApiCall<TasksV2CancelArguments, TasksV2CancelResponse>(
      this,
      tasksV2CancelRequestConfig,
    ),
  }
}
