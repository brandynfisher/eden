import { EdenMessage } from '@/features/chat/eden-message-converter'

export function createAsyncIterableFromEmitter(
  emitter: MessageEmitter,
  timeout: number,
): AsyncIterable<EdenMessage> {
  return {
    [Symbol.asyncIterator]() {
      let messageQueue: EdenMessage[] = []
      let resolveNext: ((value: IteratorResult<EdenMessage>) => void) | null =
        null
      let done = false

      const onMessage = (message: EdenMessage) => {
        if (resolveNext) {
          resolveNext({ value: message, done: false })
          resolveNext = null
        } else {
          messageQueue.push(message)
        }
      }

      emitter.on(onMessage)

      const iterator = {
        next(): Promise<IteratorResult<EdenMessage>> {
          if (done) {
            return Promise.resolve({ value: undefined, done: true })
          }
          if (messageQueue.length > 0) {
            const message = messageQueue.shift()!
            return Promise.resolve({ value: message, done: false })
          }
          return new Promise<IteratorResult<EdenMessage>>(resolve => {
            resolveNext = resolve
          })
        },
        return(): Promise<IteratorResult<EdenMessage>> {
          done = true
          emitter.off(onMessage)
          return Promise.resolve({ value: undefined, done: true })
        },
        throw(error: Error): Promise<IteratorResult<EdenMessage>> {
          done = true
          emitter.off(onMessage)
          return Promise.reject(error)
        },
        [Symbol.asyncIterator]() {
          return this
        },
      }

      // Implement timeout logic
      setTimeout(() => {
        done = true
        if (resolveNext) {
          resolveNext({ value: undefined, done: true })
          resolveNext = null
        }
        emitter.off(onMessage)
      }, timeout)

      return iterator
    },
  }
}

export class MessageEmitter {
  private listeners: ((message: EdenMessage) => void)[] = []

  emit(message: EdenMessage) {
    this.listeners.forEach(listener => listener(message))
  }

  on(listener: (message: EdenMessage) => void) {
    this.listeners.push(listener)
    return () => {
      this.off(listener)
    }
  }

  off(listener: (message: EdenMessage) => void) {
    this.listeners = this.listeners.filter(l => l !== listener)
  }
}
