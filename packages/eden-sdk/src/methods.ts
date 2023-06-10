import { AxiosRequestConfig } from 'axios'
import { AgentsCreateResponse } from 'src/responses/AgentsCreateResponse'
import { AgentsDeleteResponse } from 'src/responses/AgentsDeleteResponse'
import { AgentsGetResponse } from 'src/responses/AgentsGetResponse'
import { AgentsListResponse } from 'src/responses/AgentsListResponse'
import { AgentsUpdateResponse } from 'src/responses/AgentsUpdateResponse'

import { WebAPICallOptions, WebAPICallResult } from './EdenClient'
import { ApiKeysCreateResponse } from './responses/ApiKeysCreateResponse'
import { ApiKeysDeleteResponse } from './responses/ApiKeysDeleteResponse'
import { ApiKeysGetResponse } from './responses/ApiKeysListResponse'
import { AuthLoginResponse } from './responses/AuthLoginResponse'
import { CreationsGetResponse } from './responses/CreationsGetResponse'
import { CreationsListResponse } from './responses/CreationsListResponse'
import { GeneratorsGetResponse } from './responses/GeneratorsGetResponse'
import { GeneratorsListResponse } from './responses/GeneratorsListResponse'
import { MannaBalanceGetResponse } from './responses/MannaBalanceGetResponse'
import { TasksCreateResponse } from './responses/TasksCreateResponse'
import { TasksGetResponse } from './responses/TasksGetResponse'
import { TasksListResponse } from './responses/TasksListResponse'

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
    get: bindApiCall<AgentsGetArguments, AgentsGetResponse>(
      this,
      agentsGetRequestConfig,
    ),
    list: bindApiCall<AgentsListArguments, AgentsListResponse>(
      this,
      agentsListRequestConfig,
    ),
    delete: bindApiCall<AgentsDeleteArguments, AgentsDeleteResponse>(
      this,
      agentsDeleteRequestConfig,
    ),
  }

  public readonly apiKeys = {
    list: bindApiCall<ApiKeysListArguments, ApiKeysGetResponse>(
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

interface Capability {
  name: string
  data: any
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
  capabilities: Capability[]
}

export interface AgentsUpdateArguments extends WebAPICallOptions {
  agentId: string
  name: string
  capabilities: Capability[]
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

export interface TasksCreateArguments extends WebAPICallOptions {
  generatorName: string
  versionId?: string
  config?: any
  metadata?: any
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
