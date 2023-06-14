import { AxiosRequestConfig } from 'axios'

import { WebAPICallOptions, WebAPICallResult } from './EdenClient'
import {
  AgentsCreateResponse,
  AgentsDeleteResponse,
  AgentsGetResponse,
  AgentsListResponse,
  AgentsUpdateResponse,
} from './responses/AgentsResponses'
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
  CreationsGetResponse,
  CreationsListResponse,
} from './responses/CreationsResponses'
import {
  GeneratorsGetResponse,
  GeneratorsListResponse,
} from './responses/GeneratorsResponses'
import { MannaBalanceGetResponse } from './responses/MannaResponses'
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

  public readonly agents = {
    create: bindApiCall<AgentsCreateArguments, AgentsCreateResponse>(
      this,
      agentsCreateRequestConfig,
    ),
    update: bindApiCall<AgentsUpdateArguments, AgentsUpdateResponse>(
      this,
      agentsUpdateRequestConfig,
    ),
    delete: bindApiCall<AgentsDeleteArguments, AgentsDeleteResponse>(
      this,
      agentsDeleteRequestConfig,
    ),
    list: bindApiCall<AgentsListArguments, AgentsListResponse>(
      this,
      agentsListRequestConfig,
    ),
    get: bindApiCall<AgentsGetArguments, AgentsGetResponse>(
      this,
      agentsGetRequestConfig,
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

  public readonly creations = {
    list: bindApiCall<CreationsListArguments, CreationsListResponse>(
      this,
      creationsListRequestConfig,
    ),
    get: bindApiCall<CreationsGetArguments, CreationsGetResponse>(
      this,
      creationsGetRequestConfig,
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

export interface AgentsListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
}

export interface AgentsGetArguments extends WebAPICallOptions {
  agentId: string
}

export interface AgentsCreateArguments extends WebAPICallOptions {
  name: string
}

export interface AgentsUpdateArguments extends WebAPICallOptions {
  agentId: string
  name: string
}

export interface AgentsDeleteArguments extends WebAPICallOptions {
  agentId: string
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

export interface CapabilitiesCreateArguments extends WebAPICallOptions {
  agentId: string
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
  agentId: string | string[]
}

export interface CapabilitiesGetArguments extends WebAPICallOptions {
  capabilityId: string
}

export interface CreationsListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
}

export interface CreationsGetArguments extends WebAPICallOptions {
  creationId: string
}

export type GeneratorsListArguments = WebAPICallOptions & ListQueryParams

export interface GeneratorsGetArguments extends WebAPICallOptions {
  generatorName: string
}

export type MannaBalanceGetArguments = WebAPICallOptions

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
  webhook?: string
}

export interface TasksListArguments extends WebAPICallOptions, ListQueryParams {
  status?: string | string[]
  taskId?: string | string[]
}

export interface TasksGetArguments extends WebAPICallOptions {
  taskId: string
}

const agentsListRequestConfig = (
  args: AgentsListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams({
    ...args,
  })
  return {
    method: 'GET',
    url: 'agents',
    params,
  }
}

const agentsGetRequestConfig = (
  args: AgentsGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `agents/${args.agentId}`,
  }
}

const agentsCreateRequestConfig = (
  args: AgentsCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'agents/create',
    data: {
      ...args,
    },
  }
}

const agentsUpdateRequestConfig = (
  args: AgentsUpdateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'agents/update',
    data: {
      ...args,
    },
  }
}

const agentsDeleteRequestConfig = (
  args: AgentsDeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'agents/delete',
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
