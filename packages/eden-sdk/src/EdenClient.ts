import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import EventSourcePolyfill from 'event-source-polyfill'
import { TasksCreateArguments } from 'src/models'

import { Methods } from './methods'
import {
  TaskUpdateEvent,
  WebAPICallOptions,
  WebAPICallResult,
  WebClientOptions,
} from './types'

const NodeEventSource = require('eventsource')

interface AsyncIteratorResult {
  value: TaskUpdateEvent
  done: boolean
}

export class EdenClient extends Methods {
  public readonly edenApiUrl: string
  public readonly token?: string
  public readonly apiKey?: string
  public readonly apiSecret?: string
  private axios: AxiosInstance

  public constructor({
    edenApiUrl = 'https://api.eden.art',
    token = undefined,
    apiKey = undefined,
    apiSecret = undefined,
  }: WebClientOptions = {}) {
    super()

    this.token = token
    this.apiKey = apiKey
    this.apiSecret = apiSecret
    this.edenApiUrl = edenApiUrl

    this.axios = axios.create({
      baseURL: edenApiUrl,
    })
  }

  public subscribe(taskId?: string) {
    const headers = {
      'X-Api-Key': this.apiKey,
      'X-Api-Secret': this.apiSecret,
    }
    const query = taskId ? `?taskId=${taskId}` : ''

    const isNodeEnvironment =
      typeof process !== 'undefined' &&
      process.release &&
      process.release.name === 'node'
    const EventSource = isNodeEnvironment
      ? NodeEventSource
      : EventSourcePolyfill

    const eventSource = new EventSource(
      `${this.edenApiUrl}/tasks/events${query}`,
      { headers },
    )

    const eventIterable = {
      [Symbol.asyncIterator]: () => {
        const queue = []
        let resolver

        eventSource.onmessage = event => {
          const data = JSON.parse(event.data)
          if (data.taskId === taskId) {
            if (resolver) {
              resolver({ value: data, done: false })
              resolver = null
            } else {
              queue.push(data)
            }
          }
        }

        eventSource.onerror = error => {
          if (resolver) {
            resolver(Promise.reject(error))
            resolver = null
          } else {
            queue.push(Promise.reject(error))
          }
        }

        return {
          next(): Promise<AsyncIteratorResult> {
            if (queue.length > 0) {
              return Promise.resolve({ value: queue.shift(), done: false })
            }

            return new Promise(resolve => {
              resolver = resolve
            })
          },
        }
      },
    }

    return eventIterable
  }

  async create(args: TasksCreateArguments) {
    // Submit the task and get the ID
    const { taskId } = await this.tasks.create(args)

    // Subscribe to task updates
    for await (const event of this.subscribe(taskId)) {
      if (event.status === 'completed') {
        return event.result
      }
    }
  }

  public async apiCall(
    configFn: (options: WebAPICallOptions) => AxiosRequestConfig,
    options: WebAPICallOptions = {},
  ): Promise<WebAPICallResult> {
    const headers: Record<string, string> = {}
    if (this.token) headers.Authorization = `Bearer ${this.token}`
    if (this.apiKey && this.apiSecret) {
      headers['X-Api-Key'] = this.apiKey as string
      headers['X-Api-Secret'] = this.apiSecret as string
    }
    const requestConfig = configFn(options)
    requestConfig.headers = headers

    const response = await this.makeRequest(requestConfig)
    const result = await this.buildResult(response)
    return result
  }

  private async makeRequest(
    requestConfig: AxiosRequestConfig,
  ): Promise<AxiosResponse> {
    return this.axios.request(requestConfig)
  }

  private async buildResult(
    response: AxiosResponse,
  ): Promise<WebAPICallResult> {
    const result = response.data
    return result
  }
}
