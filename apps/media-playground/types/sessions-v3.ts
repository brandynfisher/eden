/* eslint-disable */
// This file is generated from apps/api/openapi/sessions-v3.yaml.
// Run: npm run generate:sessions-v3-types
export interface components {
  schemas: {
    SessionMessageInput: {
      content: string
      attachments?: string[]
    }
    SessionCreationInput: {
      agent_ids: string[]
    }
    SessionPromptRequest: {
      session_run_id?: string
      session_id?: string
      actor_agent_ids?: string[]
      thinking?: boolean
      creation?: components['schemas']['SessionCreationInput']
      message: components['schemas']['SessionMessageInput']
    }
    SessionPromptResponse: {
      session_id: string
      session_run_id: string
      message_id?: string
    }
    SessionStreamEvent: {
      event: 'session_created' | 'update' | 'done' | 'error' | 'heartbeat'
      data: Record<string, unknown>
    }
    ErrorResponse: {
      message: string
    }
  }
}

export interface paths {
  '/v3/sessions/prompt': {
    post: {
      requestBody: {
        content: {
          'application/json': components['schemas']['SessionPromptRequest']
        }
      }
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['SessionPromptResponse']
          }
        }
        400: {
          content: {
            'application/json': components['schemas']['ErrorResponse']
          }
        }
        401: {
          content: {
            'application/json': components['schemas']['ErrorResponse']
          }
        }
      }
    }
  }
  '/v3/sessions/prompt/stream': {
    post: {
      requestBody: {
        content: {
          'application/json': components['schemas']['SessionPromptRequest']
        }
      }
      responses: {
        200: {
          content: {
            'text/event-stream': components['schemas']['SessionStreamEvent']
          }
        }
        400: {
          content: {
            'application/json': components['schemas']['ErrorResponse']
          }
        }
        401: {
          content: {
            'application/json': components['schemas']['ErrorResponse']
          }
        }
      }
    }
  }
}
